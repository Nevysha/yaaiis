import {useRef,useEffect,useState} from "react";
import { TabView, TabPanel } from 'primereact/tabview';
import uniqid from "uniqid";
import YaaiisTabHeader from "./YaaiisTabHeader";


function Browser(props) {

    const eventBus = props.eventBus;

    const ref = useRef(null);
    const pinnedHash = useRef([]).current;
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [selectedImgs, setSelectedImgs] = useState([]);
    const [activeIndex, setActiveIndex] = useState(selectedImgs.length-1);
    const [cheatRender, setCheatRender] = useState(uniqid());

    eventBus.removeAllListeners('togglePinTab');
    eventBus.on('togglePinTab', (hash) => {
        if (pinnedHash.indexOf(hash) <= 0) {
            pinnedHash.push(hash);
            return;
        }
        for (let index in pinnedHash) {
            if (pinnedHash[index] === hash) {
                pinnedHash.splice(Number(index), 1);
            }
        }

    })

    eventBus.removeAllListeners('selectImageTab');
    eventBus.on('selectImageTab',(hash) => {
        const index = selectedImgs.map((item) => {return item.hash}).indexOf(hash);
        setActiveIndex(index);
    });

    eventBus.removeAllListeners('selectImage');
    eventBus.on('selectImage',(imgData) => {

        //remove unpined tab
        const newSelection = selectedImgs.filter((img) => {
            if (pinnedHash.indexOf(img.hash) >= 0) {
                return img;
            }
        })

        // const newSelection = selectedImgs;
        const index = selectedImgs.map((item) => {return item.hash}).indexOf(imgData.hash);
        if (index < 0) {
            newSelection.push(imgData);
            setSelectedImgs(newSelection);
            setActiveIndex(newSelection.length - 1);
        }
        else {
            setActiveIndex(index);
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
        eventBus.emit('selectTabImage', selectedImgs[e.index]);
    }



    const getHeader = (imgData) => {
        return (<YaaiisTabHeader pinnedHash={pinnedHash} closeImg={closeImg} imgData={imgData} eventBus={eventBus}/>)
    }

    function getTab() {
        return selectedImgs.map((imgData) => {
            const hash = imgData.hash;
            return (
                <TabPanel header={getHeader(imgData)} key={hash} style={{height:'100%'}}>
                    <div style={{height:'100%'}}>
                        <img style={{maxHeight: 'calc(100vh - 155px)', maxWidth: '100%'}} src={`http://localhost:6969/img/${hash}`}
                             alt={hash}/>
                    </div>
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