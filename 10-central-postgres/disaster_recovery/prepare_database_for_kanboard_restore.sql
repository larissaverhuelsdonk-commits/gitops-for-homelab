CREATE DATABASE kanboard;

create user kanboard with password 'kanboard-secret';

alter DATABASE kanboard owner to kanboard;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kanboard;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kanboard;
GRANT ALL PRIVILEGES ON SCHEMA public TO kanboard;
