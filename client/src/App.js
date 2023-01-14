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
import uniqid from 'uniqid';


function App() {

    const [value, setValue] = useState('');
    const [cheatRender, setCheatRender] = useState(uniqid());
    const [all, setAll] = useState({});
    const [selectedImgs, setSelectedImgs] = useState([]);


    const eventBus = new EventEmitter();
    eventBus.on('selectImage', (imgData) => {
        const newSelection = selectedImgs;
        newSelection.push(imgData);
        console.log(newSelection);
        setSelectedImgs(newSelection);
        setCheatRender(uniqid());
    });

    eventBus.on('closeImg', (hash) => {
        closeImg(hash);
        setCheatRender(uniqid());
    });

    const closeImg = (hash) => {

        const newSelectedImg = selectedImgs.filter((imgData) => {
            if (imgData.hash !== hash) return imgData;
        });
        setSelectedImgs(newSelectedImg);
    }

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
        console.log(blobJson);
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div style={{height: '100vh'}}>
            <span style={{display:"none"}}>{cheatRender}</span>
            <Splitter style={{height: '100%'}}>
                <SplitterPanel id='browserSplitterPanel' className="flex align-items-center justify-content-center" style={{display:'flex', flexDirection:'column'}} size={30} minSize={10}>
                    <h4>Browser</h4>
                    <div className="col-12 md:col-4">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                            <InputText placeholder="Search" />
                        </div>
                    </div>
                    <Browser all={all} eventBus={eventBus}/>
                </SplitterPanel>
                <SplitterPanel size={70} style={{display: 'flex', flexDirection:'column'}}>
                    <h4>Viewer</h4>
                    <Viewer selectedImgs={selectedImgs} eventBus={eventBus}/>
                </SplitterPanel>
            </Splitter>
        </div>
    );
}

export default App;
