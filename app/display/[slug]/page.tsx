import { notFound } from "next/navigation";
import { getPublicDisplay } from "@/lib/shulsign-data";
import DisplayScreen from "./display-screen";

export const dynamic = "force-dynamic";

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicDisplay(slug);

  if (result.status === "not-found") notFound();

  if (result.status === "not-configured") {
    return (
      <main className="connection-state" dir="rtl">
        <div>
          <span>ShulSign</span>
          <h1>מסך התצוגה מוכן לחיבור</h1>
          <p>מסד הנתונים החדש הוכן, אך פרטי החיבור הציבוריים עדיין לא הוגדרו באתר.</p>
        </div>
      </main>
    );
  }

  if (result.status === "error") {
    return (
      <main className="connection-state" dir="rtl">
        <div>
          <span>ShulSign</span>
          <h1>לא הצלחנו לטעון את התצוגה</h1>
          <p>הנתונים נשארו בטוחים. נסה לרענן את המסך בעוד רגע.</p>
        </div>
      </main>
    );
  }

  return <DisplayScreen data={result.data} />;
}
