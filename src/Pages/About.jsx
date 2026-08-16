import { Header } from '../Components/Header.jsx'
import { Footer } from '../Components/Footer.jsx'
import '../Styles/Login.css'

export function About() {
    return(
        <div className="about-page">
            <Header/>
            <h1>By Imane Mansouri, Aya Cherkaoui, Paige Hoffman for CS Girlies 2026 Hackathon!</h1>
            <Footer/>
        </div  >
    );
}