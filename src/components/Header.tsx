import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="bg-amber-400 px-3 py-2">
      <Link className="underline" to="/">
        {" "}
        Go to Home
      </Link>
    </header>
  );
}
