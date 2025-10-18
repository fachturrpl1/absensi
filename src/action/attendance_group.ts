"use server";

import { createClient } from "@/utils/supabase/server";

// Returns aggregated attendance counts grouped by department (group)
export const getAttendanceByGroup = async (organizationId?: string) => {
  const supabase = await createClient();

  if (!organizationId) {
    return { success: true, data: [] };
  }

  // First, get all members of the organization with their departments
  // First fetch valid departments for this organization to ensure we only get departments that belong to this org
  // Let's first check what departments exist for this organization
  const { data: validDepartments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (deptError) {
    console.error("Error fetching valid departments:", deptError);
    return { success: false, data: [] };
  }

  console.log("Valid departments:", validDepartments); // Debug logging

  // Get members with their departments - explicitly use the correct relationship
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      id,
      department_id,
      departments!organization_members_department_id_fkey (
        id,
        name,
        organization_id
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  console.log("Members data:", members); // Debug logging

  if (membersError) {
    console.error("Error fetching organization members:", membersError);
    return { success: false, data: [] };
  }

  // Create a map of member IDs to their department names for quick lookup
  const memberDeptMap = new Map<string, string>();
  
  if (!members) {
    console.log("No members found!");
    return { success: false, data: [] };
  }
  
  // Try to map embedded department first, but only accept departments that belong to this organization
  type EmbeddedDepartment = {
    id: string;
    name: string;
    organization_id?: string | null;
  };

  type MemberRow = {
    id: string;
    department_id: string | null;
    departments?: EmbeddedDepartment[] | EmbeddedDepartment | null;
    department?: EmbeddedDepartment | null;
    departments_organization_members_department_id_fkey?: EmbeddedDepartment[] | EmbeddedDepartment | null;
  };

  members.forEach((member: MemberRow) => {
    const raw = member.departments || member.department || member.departments_organization_members_department_id_fkey;
    if (!raw) return;

    let candidate: EmbeddedDepartment | null = null;
    if (Array.isArray(raw) && raw.length > 0) candidate = raw[0];
    else if (raw && typeof raw === 'object') candidate = raw;

    if (candidate && candidate.name) {
      // Only map if the department belongs to the requested organization
      if (String(candidate.organization_id) === String(organizationId)) {
        memberDeptMap.set(member.id, candidate.name);
      } else {
        // Skip departments that belong to other organizations (data inconsistency)
        console.warn(`Skipping department mapping for member ${member.id} because department org ${candidate.organization_id} !== ${organizationId}`);
      }
    }
  });

  // Fallback: if embedding failed or produced no mappings, fetch department names by department_id
  if (memberDeptMap.size === 0) {
    console.log('Embedded mapping empty, using fallback via department_id');
    const deptIds = Array.from(
      new Set(
        members
          .map((member: MemberRow) => member.department_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    if (deptIds.length > 0) {
      const { data: depts, error: deptFetchErr } = await supabase
        .from('departments')
        .select('id, name, organization_id')
        .in('id', deptIds)
        .eq('organization_id', organizationId);

      if (!deptFetchErr && depts) {
        type DepartmentRow = { id: string; name: string };

        const deptMap = new Map<string, string>(
          (depts as DepartmentRow[]).map((dept) => [dept.id, dept.name])
        );

        members.forEach((member: MemberRow) => {
          if (!member.department_id) {
            return;
          }

          const name = deptMap.get(member.department_id);
          if (name) {
            memberDeptMap.set(member.id, name);
          } else {
            console.warn(
              `Member ${member.id} references department_id ${member.department_id} which is not a department in organization ${organizationId}`
            );
          }
        });
      } else {
        console.warn('Failed to fetch department names for fallback', deptFetchErr);
      }
    }
  }
  
  if (memberDeptMap.size === 0) {
    console.log("No department mappings created! Members:", members);
  }
  
  console.log("Department map:", Object.fromEntries(memberDeptMap)); // Debug logging

  // Get attendance records only for these members
  const memberIds = members.map((member: MemberRow) => member.id);
  
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('status, organization_member_id')
    .in('organization_member_id', memberIds);

  if (recordsError) {
    console.error("Error fetching attendance records:", recordsError);
    return { success: false, data: [] };
  }

  // Aggregate attendance by department
  const groupsMap: Record<
    string,
    { group: string; present: number; late: number; absent: number; excused: number; others: number }
  > = {};

  // Initialize groups with 0 counts
  for (const [_, deptName] of memberDeptMap) {
    if (!groupsMap[deptName]) {
      groupsMap[deptName] = {
        group: deptName,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        others: 0
      };
    }
  }

  // Count attendance for each group
  (records || []).forEach((rec) => {
    const deptName = memberDeptMap.get(rec.organization_member_id) ?? "Unknown";
    
    if (!groupsMap[deptName]) {
      groupsMap[deptName] = {
        group: deptName,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        others: 0
      };
    }

    const status = rec.status;
    if (status === "present") groupsMap[deptName].present += 1;
    else if (status === "late") groupsMap[deptName].late += 1;
    else if (status === "absent") groupsMap[deptName].absent += 1;
    else if (status === "excused") groupsMap[deptName].excused += 1;
    else {
      // exclude explicit 'go_home' status from Others aggregation if present
      if (status === "go_home" || status === "go-home" || status === "gone_home") {
        // do not count into others
      } else {
        groupsMap[deptName].others += 1;
      }
    }
  });

  const result = Object.values(groupsMap)
    .filter(g => g.group !== "Unknown") // Optional: remove Unknown group if you don't want to show it
    .map((g) => ({
      group: g.group,
      present: g.present,
      late: g.late,
      absent: g.absent,
      excused: g.excused,
      others: g.others,
      total: g.present + g.late + g.absent + g.excused + g.others,
    }));

  return { success: true, data: result };
};
