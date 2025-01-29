const bcrypt = require("bcryptjs");

const runTest = async () => {
  const storedHash =
    "$$2a$10$aObqWjU02nCFI8A2qF9kc.Duw9VrnyZ39H8/XEPyRI89CePsLe/sK"; // Replace with the hash from your database
  const plainPassword = "AdminPassword123";

  const isMatch = await bcrypt.compare(plainPassword, storedHash);
  console.log("Password match:", isMatch); // Should print true if the password is correct
};

runTest();
