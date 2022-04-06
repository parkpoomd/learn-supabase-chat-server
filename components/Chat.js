import {useEffect, useState, useRef} from 'react';

import styles from '../styles/Chat.module.css';

const Chat = ({currentUser, session, supabase}) => {
  if (!currentUser) return null;

  const [messages, setMessages] = useState([]);
  const message = useRef('');
  const [editingUsername, setEditingUsername] = useState(false);
  const newUsername = useRef('');
  const [users, setUsers] = useState({});

  useEffect(() => {
    const getMessages = async () => {
      let {data: messages, error} = await supabase.from('message').select('*');

      setMessages(messages);
    };

    getMessages();

    const setupMessagesSubscription = async () => {
      await supabase
        .from('message')
        .on('INSERT', (payload) => {
          setMessages((previous) => [].concat(previous, payload.new));
        })
        .subscribe();
    };

    setupMessagesSubscription();

    const setupUsersSubscription = async () => {
      await supabase
        .from('user')
        .on('UPDATE', (payload) => {
          setUsers((users) => {
            const user = users[payload.new.id];
            if (user) {
              return Object.assign({}, users, {
                [payload.new.id]: payload.new,
              });
            } else {
              return users;
            }
          });
        })
        .subscribe();
    };

    setupUsersSubscription();
  }, [supabase]);

  const sendMessage = async (evt) => {
    evt.preventDefault();

    const content = message.current.value;
    await supabase
      .from('message')
      .insert([{content, user_id: session.user.id}]);

    message.current.value = '';
  };

  const logout = (evt) => {
    evt.preventDefault();
    window.localStorage.clear();
    window.localStorage.reload();
    // supabase.auth.signOut();
  };

  const setUsername = async (evt) => {
    evt.preventDefault();
    const username = newUsername.current.value;
    await supabase
      .from('user')
      .insert([{...currentUser, username}], {upsert: true});
    newUsername.current.value = '';
    setEditingUsername(false);
  };

  const getUsersFromSupabase = async (users, userIds) => {
    const usersToGet = Array.from(userIds).filter((userId) => !users[userId]);
    if (Object.keys(users).length && usersToGet.length == 0) return users;

    const {data} = await supabase
      .from('user')
      .select('id, username')
      .in('id', usersToGet);

    const newUsers = {};
    data.forEach((user) => (newUsers[user.id] = user));
    return Object.assign({}, users, newUsers);
  };

  useEffect(() => {
    const getUsers = async () => {
      const userIds = new Set(messages.map((message) => message.user_id));
      const newUsers = await getUsersFromSupabase(users, userIds);
      setUsers(newUsers);
    };

    getUsers();
  }, [messages]);

  const username = (user_id) => {
    const user = users[user_id];
    if (!user) return '';
    return user.username ? user.username : user.id;
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Supabase Chat</h1>
          <p>
            Welcome,{' '}
            {currentUser.username ? currentUser.username : session.user.email}
          </p>
        </div>
        <div className={styles.settings}>
          {editingUsername ? (
            <form onSubmit={setUsername}>
              <input placeholder="new username" required ref={newUsername} />
              <button type="submit">Update username</button>
            </form>
          ) : (
            <div>
              <button onClick={() => setEditingUsername(true)}>
                Edit username
              </button>
              <button onClick={(evt) => logout(evt)}>Log out</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.container}>
        {messages.map((message) => (
          <div key={message.id} className={styles.messageContainer}>
            <span className={styles.user}>{username(message.user_id)}</span>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <form className={styles.chat} onSubmit={sendMessage}>
        <input
          className={styles.messageInput}
          placeholder="Write your message"
          required
          ref={message}
        />
        <button className={styles.submit} type="submit">
          Send message
        </button>
      </form>
    </>
  );
};

export default Chat;
