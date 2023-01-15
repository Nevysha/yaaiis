import {useState,useEffect} from "react";
import { InputText } from 'primereact/inputtext';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import "primereact/resources/themes/bootstrap4-dark-purple/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "react-resizable/css/styles.css"
import './App.css';
import Browser from "./Browser";
import EventEmitter from "eventemitter3";
import Viewer from "./Viewer";
import ImgData from "./ImgData";
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Resizable } from 'react-resizable';


function App() {

    const [searchValue, setSearchValue] = useState('');
    const [all, setAll] = useState({});
    const [browserWidth, setBrowserWidth] = useState(440);
    const [infoWidth, setInfoWidth] = useState(500);
    const [viewerWidth, setViewerWidth] = useState(window.innerWidth - (browserWidth + infoWidth));


    const eventBus = new EventEmitter();

    const load = async () => {
        const response = await fetch("http://localhost:6969/img/data/all");
        const reader = response.body.getReader();

        let blob = await new Response(await new ReadableStream({
            start(controller) {
                return pump();
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        // When no more data needs to be consumed, close the stream
                        if (done) {
                            controller.close();
                            return;
                        }
                        // Enqueue the next data chunk into our target stream
                        controller.enqueue(value);
                        return pump();
                    });
                }
            }
        })).blob();
        let blobJson = JSON.parse(await blob.text());
        setAll(blobJson);
    }

    useEffect(() => {
        load();
    }, []);


    const onFirstResizeBrowser = (event, {element, size, handle}) => {
        setBrowserWidth(size.width);
        setViewerWidth(window.innerWidth - (infoWidth + browserWidth));
    }

    const onFirstResizeInfo = (event, {element, size, handle}) => {
        setInfoWidth(size.width);
        setViewerWidth(window.innerWidth - (infoWidth + browserWidth));
    }

    const applySearch = () => {
        if (searchValue === "") return all;

        const filtered = {};
        for (let hash of Object.keys(all)) {
            const imgData = all[hash];

            if (JSON.stringify(imgData.generationMetadata).includes(searchValue)) {
                filtered[hash] = imgData;
                continue;
            }
            if (JSON.stringify(imgData.paths).includes(searchValue)) {
                filtered[hash] = imgData;
                continue;
            }

        }
        return filtered;
    }

    const items = [
        {
            label:'Filter',
            icon:'pi pi-fw pi-pencil',
            items:[
                {
                    label:'With metadata',
                },
                {
                    label:'No upscale',
                },
                {
                    label:'Model',
                    items: [
                        {label: 'ModelA'},
                        {label: 'ModelB'}
                    ]
                },

            ]
        },
        {
            label:'Refresh',
            icon:'pi pi-fw pi-refresh',
            command:() => fetch('http://localhost:6969/refresh')
        }
    ];

    return (
        <div style={{height: '100vh', display:'flex', flexDirection:'column'}}>

            <Menubar
                model={items}
                start={
                    <div className="menubar-right">
                        <img src="./nevy-icon-1-256-round.png" width='40px'/>
                        <div className="p-inputgroup">
                                            <span className="p-inputgroup-addon">
                                                <FontAwesomeIcon icon={faSearch}/>
                                            </span>
                            <InputText placeholder="Search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)}/>
                        </div>
                    </div>
                }
                end={<Button label="Help" icon="pi pi-question"/>}/>

            <div style={{height: '100%', display:'flex'}}>

                <Resizable width={browserWidth} id='browserSplitterPanel'
                        style={{display:'flex', flexDirection:'column', paddingRight:'10px'}}
                        resizeHandles={['e']}
                        onResize={onFirstResizeBrowser}>

                    <div style={{width:browserWidth+"px", height:'100%'}}>
                        <h4>Browser</h4>
                        <Browser all={applySearch()} eventBus={eventBus}/>
                    </div>

                </Resizable>

                <div style={{display: 'flex', flexDirection:'column', flex:1, height:"100%", maxWidth:viewerWidth+'px', padding:"0 5px 0 5px"}}>
                    <h4>Viewer</h4>
                    <Viewer eventBus={eventBus}/>
                </div>

                <div style={{display: 'flex', flexDirection:'column'}}>

                    <Resizable width={infoWidth} id='browserSplitterPanel'
                               style={{display:'flex', flexDirection:'column', paddingRight:'10px'}}
                               resizeHandles={['w']}
                               onResize={onFirstResizeInfo}>

                        <div style={{width:infoWidth+"px", height:'100%'}}>
                            <h4>info</h4>
                            <ImgData eventBus={eventBus}/>
                        </div>

                    </Resizable>

                </div>
            </div>
        </div>
    );
}

export default App;
