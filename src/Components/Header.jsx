import { Link } from "react-router-dom";
import '../Styles/Header.css'

export function Header(){

    return(
        <header>
            <h1>Symptom Tracker</h1>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                </ul>
            </nav>
        </header>
    );
}
