import "cropperjs/dist/cropper.css";
import "@/styles/globals.css";
import Head from "next/head";
import AppContainer from "../components/AppContainer";

export default function App() {
  return (
    <>
      <Head>
        <title>پنل هنرمندان صداباکس</title>
        <meta name="description" content="پنل مدیریت هنرمندان صداباکس" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <AppContainer />
    </>
  );
}
