import {useRef,useEffect,useState} from "react";
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import uniqid from "uniqid";


function Browser(props) {

    const eventBus = props.eventBus;

    const ref = useRef(null);
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [selectedImgs, setSelectedImgs] = useState([]);
    const [activeIndex, setActiveIndex] = useState(selectedImgs.length-1);
    const [cheatRender, setCheatRender] = useState(uniqid());

    eventBus.removeAllListeners('selectImage');
    eventBus.on('selectImage',(imgData) => {
        const newSelection = selectedImgs;
        if (newSelection.map((item) => {return item.hash}).indexOf(imgData.hash) < 0) {
            newSelection.push(imgData);
            setSelectedImgs(newSelection);
            setActiveIndex(newSelection.length - 1);
        }

        setCheatRender(uniqid());
    });

    useEffect(() => {

        const onResize = () => {
            setHeight(ref.current.clientHeight);
            setWidth(ref.current.clientWidth);
        }
        onResize();

        window.addEventListener("resize", onResize);

    }, []);

    const closeImg = (hash, e) => {
        e.stopPropagation();
        const newSelectedImg = selectedImgs;
        const index = selectedImgs.map((item) => {return item.hash}).indexOf(hash)
        newSelectedImg.splice(index,1);
        setSelectedImgs(newSelectedImg);
        if (index <= activeIndex) {
            setActiveIndex(activeIndex-1);
        }
        setCheatRender(uniqid());
    }

    const onTabChange = (e) => {
        setActiveIndex(e.index);
    }

    const getHeader = (hash) => {
        return (
            <div>
                {hash.substring(0,8)}
                <Button className="tabButtonClose" onClick={(e) => closeImg(hash,e)}>
                    <FontAwesomeIcon icon={faXmark} />
                </Button>
            </div>
        );
    }

    function getTab() {
        return selectedImgs.map((imgData) => {
            const hash = imgData.hash;
            return (
                <TabPanel header={getHeader(hash)} key={hash}>
                    <img style={{maxHeight: height, maxWidth: width}} src={`http://localhost:6969/img/${hash}`}
                         alt={hash}/>
                </TabPanel>
            )
        });
    }

    return (
        <div style={{flex:1,height: '100%'}} ref={ref}>
            <span style={{display:"none"}}>{cheatRender}</span>
            <TabView activeIndex={activeIndex} onTabChange={(e) => onTabChange(e)}>
                {getTab()}
            </TabView>
        </div>
    )
}

export default Browser;