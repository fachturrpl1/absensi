create table public.url_visits (
  id bigserial not null,
  organization_member_id integer not null,
  project_id integer null,
  visit_date date not null,
  url text not null,
  domain character varying(255) null,
  title character varying(500) null,
  tracked_seconds integer null default 0,
  visit_count integer null default 1,
  category character varying(100) null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_productive character varying(50) null default 'unproductive'::character varying,
  constraint url_visits_pkey primary key (id),
  constraint url_visits_organization_member_id_fkey foreign KEY (organization_member_id) references organization_members (id),
  constraint url_visits_project_id_fkey foreign KEY (project_id) references projects (id),
  constraint url_visits_is_productive_check check (
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
  )
) TABLESPACE pg_default;

create index IF not exists idx_url_visits_member_date on public.url_visits using btree (organization_member_id, visit_date) TABLESPACE pg_default;

create index IF not exists idx_url_visits_domain on public.url_visits using btree (domain) TABLESPACE pg_default;

create trigger update_url_visits_updated_at BEFORE
update on url_visits for EACH row
execute FUNCTION update_updated_at_column ();