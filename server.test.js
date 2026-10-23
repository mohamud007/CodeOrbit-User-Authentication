
const request = require("supertest");
const app = require("./server");
const pool = require("./db");

describe("User Authentication API", () => {
    const agent = request.agent(app);

    const testEmail =
        `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

    const testPassword = "TestPassword123!";
    const testName = "Automated Test User";

    describe("Signup", () => {
        test("creates a new account", async () => {
            const response = await agent
                .post("/api/auth/signup")
                .send({
                    name: testName,
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe(
                "Account created successfully"
            );
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user.password_hash).toBeUndefined();
            expect(response.body.user.password).toBeUndefined();
        });

        test("rejects a duplicate email", async () => {
            const response = await agent
                .post("/api/auth/signup")
                .send({
                    name: testName,
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(409);
        });
    });

    describe("Login", () => {
        test("logs in with correct credentials", async () => {
            const response = await agent
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Login successful");
            expect(response.body.user.email).toBe(testEmail);
        });

        test("rejects an incorrect password", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "WrongPassword123!"
                });

            expect(response.status).toBe(401);
        });
    });

    describe("Protected profile", () => {
        test("rejects requests without a session", async () => {
            const response = await request(app)
                .get("/api/auth/profile");

            expect(response.status).toBe(401);
        });

        test("returns the profile for the logged-in user", async () => {
            const response = await agent
                .get("/api/auth/profile");

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user.name).toBe(testName);
            expect(response.body.user.password_hash).toBeUndefined();
        });
    });

    describe("Logout", () => {
        test("logs out successfully", async () => {
            const response = await agent
                .post("/api/auth/logout");

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Logout successful");
        });

        test("blocks profile access after logout", async () => {
            const response = await agent
                .get("/api/auth/profile");

            expect(response.status).toBe(401);
        });
    });
});
afterAll(async () => {
    await pool.end();
});