import { Link } from "react-router-dom";
import '../Styles/Header.css'

export function Header(){

    return(
        <header>
            <h1>Signall</h1> <h3>Symptom Tracker</h3>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                </ul>
            </nav>
        </header>
    );
}
