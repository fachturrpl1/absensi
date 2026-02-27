create table public.tool_usages (
  id bigserial not null,
  organization_member_id integer not null,
  project_id integer null,
  usage_date date not null,
  tool_name character varying(255) not null,
  tool_type character varying(50) null,
  tracked_seconds integer null default 0,
  activations integer null default 0,
  category character varying(100) null,
  productivity_score integer null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_productive character varying(50) null default 'non-core-work'::character varying,
  constraint tool_usages_pkey primary key (id),
  constraint tool_usages_organization_member_id_usage_date_tool_name_too_key unique (
    organization_member_id,
    usage_date,
    tool_name,
    tool_type
  ),
  constraint tool_usages_organization_member_id_fkey foreign KEY (organization_member_id) references organization_members (id),
  constraint tool_usages_project_id_fkey foreign KEY (project_id) references projects (id),
  constraint tool_usages_is_productive_check check (
    (
      (is_productive)::text = any (
        (
          array[
            'core-work'::character varying,
            'non-core-work'::character varying,
            'unproductive'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_tool_type check (
    (
      (tool_type is null)
      or (
        (tool_type)::text = any (
          (
            array[
              'application'::character varying,
              'website'::character varying,
              'browser'::character varying
            ]
          )::text[]
        )
      )
    )
  ),
  constraint chk_productivity_score check (
    (
      (productivity_score is null)
      or (
        (productivity_score >= '-100'::integer)
        and (productivity_score <= 100)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tool_usages_member_date on public.tool_usages using btree (organization_member_id, usage_date) TABLESPACE pg_default;

create index IF not exists idx_tool_usages_tool_name on public.tool_usages using btree (tool_name) TABLESPACE pg_default;

create trigger update_tool_usages_updated_at BEFORE
update on tool_usages for EACH row
execute FUNCTION update_updated_at_column ();