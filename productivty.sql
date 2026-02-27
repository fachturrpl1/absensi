create table public.productivity_categories (
  id serial not null,
  organization_id integer null,
  name character varying(100) not null,
  description text null,
  match_type character varying(50) not null,
  match_pattern character varying(255) not null,
  productivity_score integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_productive character varying(50) null default 'non-core-work'::character varying,
  constraint productivity_categories_pkey primary key (id),
  constraint productivity_categories_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint chk_category_score check (
    (
      (productivity_score >= '-100'::integer)
      and (productivity_score <= 100)
    )
  ),
  constraint chk_match_type check (
    (
      (match_type)::text = any (
        (
          array[
            'app_name'::character varying,
            'domain'::character varying,
            'url_pattern'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint productivity_categories_is_productive_check check (
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

create trigger update_productivity_categories_updated_at BEFORE
update on productivity_categories for EACH row
execute FUNCTION update_updated_at_column ();