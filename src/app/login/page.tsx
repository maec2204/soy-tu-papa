import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { signIn, signUp } from "@/lib/matches";

const field =
  "mt-1 w-full rounded-2xl border-2 border-linea/30 bg-mesa-honda px-4 py-3 text-lg placeholder:text-linea/40";

const ERRORS: Record<string, string> = {
  entrar:
    "El correo o la clave no coinciden. Si nunca has creado tu clave con este correo, toca «Es mi primera vez».",
  crear:
    "No se pudo crear la cuenta. Revisa que tu correo esté en la lista de jugadores y que no tenga ya una clave.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, primera } = await searchParams;
  const firstTime = primera !== undefined;

  return (
    <main className="entra mx-auto flex min-h-dvh max-w-md flex-col justify-between gap-10 px-6 py-10">
      <div>
        <h1 className="font-display text-7xl leading-[0.85] font-bold">
          Soy
          <br />
          tu papá
        </h1>
        <div className="red my-8" />
        <p className="max-w-[28ch] text-lg text-linea/80">
          La cuenta de los partidos de ping pong de la oficina. Quién gana, quién
          pierde y quién es papá de quién.
        </p>
      </div>

      <form action={firstTime ? signUp : signIn} className="space-y-4">
        <h2 className="font-display text-3xl font-semibold">
          {firstTime ? "Crea tu clave" : "Entra"}
        </h2>
        {typeof error === "string" && ERRORS[error] && (
          <p role="alert" className="font-medium text-goma">
            {ERRORS[error]}
          </p>
        )}
        {firstTime && (
          <label className="block font-semibold">
            Tu nombre, como saldrá en la tabla
            <input name="name" required maxLength={40} autoComplete="name" className={field} />
          </label>
        )}
        <label className="block font-semibold">
          Correo
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block font-semibold">
          {firstTime ? "Clave nueva, de 6 caracteres o más" : "Clave"}
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={firstTime ? "new-password" : "current-password"}
            className={field}
          />
        </label>
        <SubmitButton className="w-full rounded-full bg-pelota px-6 py-4 text-lg font-semibold text-mesa-honda">
          {firstTime ? "Crear clave y entrar" : "Entrar"}
        </SubmitButton>
        <Link
          href={firstTime ? "/login" : "/login?primera=1"}
          className="boton block rounded-full border-2 border-linea/50 px-6 py-3 text-center font-semibold"
        >
          {firstTime ? "Ya tengo clave" : "Es mi primera vez"}
        </Link>
      </form>
    </main>
  );
}
