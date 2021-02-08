import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Port Checker</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the Stakehouse port checker
        </h1>
        <p className={styles.description}>
          See <a href="/api/checker">/api/checker</a> or <a href="/api/checker?ports=9000,12000,13000">/api/checker?ports=9000,12000,13000</a>
        </p>
      </main>
    </div>
  )
}
