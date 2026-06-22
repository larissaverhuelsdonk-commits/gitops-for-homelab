This folder is in .gitignore, so it needs to be backed up separately.
However, this also means that passwords are not on github.

To be even more professional, use docker secrets where applicable, while retaining non-secret configuration in .env-files.
This is only supported by some images, however, so a mix will probably still be necessary.
