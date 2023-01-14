import {useState,useEffect} from "react";
import { InputText } from 'primereact/inputtext';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import "primereact/resources/themes/bootstrap4-dark-purple/theme.css";  //theme
import "primereact/resources/primereact.min.css";                  //core css
import "primeicons/primeicons.css";                                //icons
import './App.css';
import Browser from "./Browser";
import EventEmitter from "eventemitter3";
import Viewer from "./Viewer";
import ImgData from "./ImgData";
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';


function App() {

    const [value, setValue] = useState('');
    const [all, setAll] = useState({});


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
            icon:'pi pi-fw pi-refresh'
        }
    ];

    return (
        <div style={{height: '100vh'}}>

            <Menubar
                model={items}
                start={
                    <div className="menubar-right">
                        <img src="./nevy-icon-1-256-round.png" width='40px'/>
                        <div className="p-inputgroup">
                                            <span className="p-inputgroup-addon">
                                                <FontAwesomeIcon icon={faSearch}/>
                                            </span>
                            <InputText placeholder="Search"/>
                        </div>
                    </div>
                }
                end={<Button label="Help" icon="pi pi-question"/>}/>

            <Splitter style={{height: '100%'}}>
                <SplitterPanel id='browserSplitterPanel' className="flex align-items-center justify-content-center" style={{display:'flex', flexDirection:'column'}} size={30} minSize={10}>
                    <h4>Browser</h4>
                    <Browser all={all} eventBus={eventBus}/>
                </SplitterPanel>
                <SplitterPanel size={50} style={{display: 'flex', flexDirection:'column'}}>
                    <h4>Viewer</h4>
                    <Viewer eventBus={eventBus}/>
                </SplitterPanel>
                <SplitterPanel size={20} style={{display: 'flex', flexDirection:'column'}}>
                    <h4>info</h4>
                    <ImgData eventBus={eventBus}/>
                </SplitterPanel>
            </Splitter>
        </div>
    );
}

export default App;
