const Auth = ({supabase}) => {
  const signInWithGithub = async () => {
    let {user, error} = await supabase.auth.signIn({
      provider: 'github',
    });
  };

  return (
    <div>
      <button onClick={signInWithGithub}>Log in with GitHub</button>
    </div>
  );
};

export default Auth;
