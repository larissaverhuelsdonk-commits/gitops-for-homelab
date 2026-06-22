CREATE DATABASE paperless;

create user paperless with password 'paperless';

alter DATABASE paperless owner to paperless;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO paperless;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO paperless;
GRANT ALL PRIVILEGES ON SCHEMA public TO paperless;
