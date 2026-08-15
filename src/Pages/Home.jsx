import { Header } from '../Components/Header.jsx'
import { AuthWin } from '../Components/AuthWin.jsx'
import { Footer } from '../Components/Footer.jsx'

export function Home() {
    return(
        <>
            <Header/>
            <AuthWin/>
            <Footer/>
        </>
    );
}