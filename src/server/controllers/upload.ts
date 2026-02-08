import { mkdir } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { applications, documents } from "../../db/schema";
import { auth } from "../middleware/auth";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Ensure uploads dir exists for local dev
await mkdir("uploads", { recursive: true });

// Configure Cloudinary
if (process.env.STORAGE_PROVIDER === "cloudinary") {
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	});
}

export const uploadController = new Elysia({ prefix: "/upload" })
	.use(auth)
	.post(
		"/",
		async ({ body, error }) => {
			const { file, application_id, file_type } = body;
			const appId = parseInt(application_id, 10);

			if (!file) return error(400, "File required");

			const fileName = `${Date.now()}-${file.name}`;
			let filePath = "";

			if (process.env.STORAGE_PROVIDER === "cloudinary") {
				// Cloudinary Upload
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				try {
					const uploadResult = await new Promise<any>((resolve, reject) => {
						const uploadStream = cloudinary.uploader.upload_stream(
							{ folder: "nafdac_docs", resource_type: "auto" },
							(err, result) => {
								if (err) reject(err);
								else resolve(result);
							}
						);
						// Create a readable stream from the buffer
						const stream = new Readable();
						stream.push(buffer);
						stream.push(null);
						stream.pipe(uploadStream);
					});
					filePath = uploadResult.secure_url;
				} catch (e: any) {
					console.error("Cloudinary Upload Failed:", e);
					return error(500, "Cloud Upload Failed");
				}
			} else {
				// Local Upload
				filePath = `uploads/${fileName}`;
				await Bun.write(filePath, file);
			}

			const result = await db
				.insert(documents)
				.values({
					application_id: appId,
					file_type,
					file_path: filePath,
				})
				.returning();

			// Auto-advance status
			await db
				.update(applications)
				.set({ status: "FINANCE_PENDING" })
				.where(eq(applications.id, appId));

			return { success: true, document: result[0] };
		},
		{
			body: t.Object({
				file: t.File(),
				application_id: t.String(),
				file_type: t.String(),
			}),
			ensureRole: ["DIRECTOR", "DOCUMENTATION"],
		}
	);
