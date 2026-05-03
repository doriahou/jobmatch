import { serverUploadFile, DifyServerError } from "@/lib/difyServer";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "请上传有效的文件" }, { status: 400 });
    }

    const fileId = await serverUploadFile(file);
    return Response.json({ file_id: fileId });
  } catch (err) {
    if (err instanceof DifyServerError) {
      return Response.json(
        { error: err.message, code: "DIFY_ERROR" },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : "文件上传失败";
    return Response.json({ error: message, code: "INTERNAL" }, { status: 500 });
  }
}
