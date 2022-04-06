import Head from 'next/head';
import styles from '../styles/Home.module.css';

import {useEffect, useState} from 'react';
import Auth from '../components/Auth';
import Chat from '../components/Chat';

export default function Home({currentUser, session, supabase}) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!session);
  }, [session]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Supabase Chat App</title>
      </Head>

      <main className={styles.main}>
        {loggedIn ? (
          <Chat
            currentUser={currentUser}
            session={session}
            supabase={supabase}
          />
        ) : (
          <Auth supabase={supabase} />
        )}
      </main>
    </div>
  );
}
