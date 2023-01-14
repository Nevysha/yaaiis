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
    const [activeIndex, setActiveIndex] = useState(props.activeIndex);
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
            setHeight(ref.current.clientHeight - 100);
            setWidth(ref.current.clientWidth - document.getElementById('browserSplitterPanel').offsetWidth - 10);
        }
        onResize();

        window.addEventListener("resize", onResize);

    }, []);

    const onTabClose = (e) => {
        const newSelectedImg = selectedImgs;
        newSelectedImg.splice(e.index,1);
        setSelectedImgs(newSelectedImg);
    }

    const onTabChange = (e) => {
        console.log('onTabChange:');
        console.log(e);
        setActiveIndex(e.index);
    }

    const getHeader = (hash) => {
        return (
            <div>
                {hash.substring(0,8)}
                {/*<Button className="tabButtonClose" onClick={(e) => closeImg(hash,e)}>*/}
                {/*    <FontAwesomeIcon icon={faXmark} />*/}
                {/*</Button>*/}
            </div>
        );
    }

    function getTab() {
        console.log(selectedImgs);
        return selectedImgs.map((imgData) => {
            const hash = imgData.hash;
            return (
                <TabPanel header={getHeader(hash)} key={hash} closable>
                    <img style={{maxHeight: height, maxWidth: width}} src={`http://localhost:6969/img/${hash}`}
                         alt={hash}/>
                </TabPanel>
            )
        });
    }

    return (
        <div style={{flex:1,height: '100%'}} ref={ref}>
            <span style={{display:"none"}}>{cheatRender}</span>
            <TabView activeIndex={activeIndex} onTabClose={(e) => onTabClose(e)} onTabChange={(e) => onTabChange(e)}>
                {getTab()}
            </TabView>
        </div>
    )
}

export default Browser;