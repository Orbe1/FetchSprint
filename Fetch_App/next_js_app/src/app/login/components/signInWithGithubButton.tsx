import { Button } from "@/components/ui/button";
import { signInWithGithub } from "@/supabase-actions/auth-actions";

const signInWithGithubButton = () => {
  return <Button onClick={signInWithGithub}>Login with Github</Button>;
};
export default signInWithGithubButton;
