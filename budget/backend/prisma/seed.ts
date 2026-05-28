import { prisma } from "../src/lib/prisma.js";

/** No default users; create an account via `POST /api/auth/signup` or the `/account` UI. */
async function main() {
  // Intentionally empty — users are created through signup.
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
