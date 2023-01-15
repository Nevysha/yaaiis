import {Button} from "primereact/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark, faMapPin} from "@fortawesome/free-solid-svg-icons";
import {useState} from "react";

function YaaiisTabHeader(props) {

    const eventBus = props.eventBus;

    const [imgData] = useState(props.imgData);
    const [showHover, setShowHover] = useState(false);
    const closeImg = props.closeImg;

    const hash = imgData.hash;

    const activateTab = () => {
        setShowHover(false);
        eventBus.emit('selectImage', hash);
        eventBus.emit('selectTabImage', hash);
    }

    if (!hash) return (<div/>);

    return (
        <div style={{display:'flex'}}>
            <Button className="tabButton tabButtonPin" title="Pin tab">
                <FontAwesomeIcon icon={faMapPin} />
            </Button>
            <div className="tab-title-text" onMouseEnter={() => setShowHover(true)}>{hash.substring(0,8)}</div>
            <Button className="tabButton tabButtonClose" onClick={(e) => closeImg(hash,e)}>
                <FontAwesomeIcon icon={faXmark} />
            </Button>
            {showHover &&
            <div className="tabShowHover"
                    onMouseEnter={() => setShowHover(true)}
                    onMouseLeave={() => setShowHover(false)}
                    onClick={() => activateTab()}>
                <img style={{maxHeight: '100%', maxWidth: '100%'}} src={`http://localhost:6969/img/${hash}`}
                     alt={hash}/>
            </div>
            }
        </div>
    );
}
export default YaaiisTabHeader;