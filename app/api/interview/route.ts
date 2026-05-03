import { serverRunInterview, DifyServerError } from "@/lib/difyServer";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { jd?: string; file_id?: string };

    if (!body.jd?.trim()) {
      return Response.json({ error: "请提供职位描述（jd）" }, { status: 400 });
    }
    if (!body.file_id) {
      return Response.json({ error: "请提供简历文件 ID（file_id）" }, { status: 400 });
    }

    const output = await serverRunInterview(body.jd, body.file_id);
    return Response.json({ output });
  } catch (err) {
    if (err instanceof DifyServerError) {
      return Response.json(
        { error: err.message, code: "DIFY_ERROR" },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : "面试题生成失败";
    return Response.json({ error: message, code: "INTERNAL" }, { status: 500 });
  }
}
