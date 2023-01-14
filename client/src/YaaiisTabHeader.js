import {Button} from "primereact/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {useState} from "react";

function YaaiisTabHeader(props) {

    const [imgData] = useState(props.imgData);
    const [showHover, setShowHover] = useState(false);
    const closeImg = props.closeImg;

    const toggleShowHover = () => {
        setShowHover(!showHover);
    }

    const hash = imgData.hash;
    return (
        <div onMouseEnter={() => toggleShowHover()} onMouseLeave={() => toggleShowHover()}>
            {hash.substring(0,8)}
            <Button className="tabButtonClose" onClick={(e) => closeImg(hash,e)}>
                <FontAwesomeIcon icon={faXmark} />
            </Button>
            {showHover &&
            <div className="tabShowHover">
                <img style={{maxHeight: '100%', maxWidth: '100%'}} src={`http://localhost:6969/img/${hash}`}
                     alt={hash}/>
            </div>
            }
        </div>
    );
}
export default YaaiisTabHeader;