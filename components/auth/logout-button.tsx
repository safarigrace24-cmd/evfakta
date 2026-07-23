import { signOutAction } from "@/app/auth/actions";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className || "button secondary buttonSm"}>
        Logg ut
      </button>
    </form>
  );
}
