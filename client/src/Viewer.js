import {useRef,useEffect,useState} from "react";
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


function Browser(props) {

    const eventBus = props.eventBus;

    const ref = useRef(null);
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [selectedImgs, setSelectedImgs] = useState(props.selectedImgs);
    const [activeIndex, setActiveIndex] = useState(props.activeIndex);
    const [selectedImageHash, setSelectedImageHash] = useState(activeIndex);

    useEffect(() => {

        const onResize = () => {
            setHeight(ref.current.clientHeight - 100);
            setWidth(ref.current.clientWidth - document.getElementById('browserSplitterPanel').offsetWidth - 10);
        }
        onResize();

        window.addEventListener("resize", onResize);

    }, []);
    useEffect(() => {
        setSelectedImgs(props.selectedImgs);
        setActiveIndex(props.activeIndex);
    }, [props.selectedImgs, props.activeIndex]);

    const selectImage = (index) => {
        setActiveIndex(index);
        setSelectedImageHash(selectedImgs[index].hash);
    }

    const closeImg = (hash, e) => {
        e.stopPropagation();
        eventBus.emit('closeImg', hash);
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

    return (
        <div style={{flex:1,height: '100%'}} ref={ref}>
            <TabView activeIndex={activeIndex} onTabChange={(e) => selectImage(e.index)}>
                {selectedImgs.map((imgData) => {
                    const hash = imgData.hash;
                    return (
                        <TabPanel header={getHeader(hash)} key={hash}>
                            <img style={{maxHeight:height, maxWidth:width}} src={`http://localhost:6969/img/${hash}`} alt={hash}/>
                        </TabPanel>
                    )
                })}
            </TabView>
        </div>
    )
}

export default Browser;