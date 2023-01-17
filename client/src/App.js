import {useState,useEffect} from "react";
import { InputText } from 'primereact/inputtext';
import { AutoComplete } from 'primereact/autocomplete';
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
import uniqid from "uniqid";
import io from 'socket.io-client';

const socket = io('http://localhost:6968', {
    reconnectionDelay: 1000,
    reconnection: true,
    reconnectionAttemps: 10,
    transports: ['websocket'],
    agent: false,
    upgrade: false,
    rejectUnauthorized: false
});

function App() {

    const [searchValue, setSearchValue] = useState('');

    const [filterPromptValue, setFilterPromptValue] = useState([]);
    const [filterModelValue, setFilterModelValue] = useState([]);
    const [filterSamplerValue, setFilterSamplerValue] = useState([]);

    const [all, setAll] = useState([]);
    const [modelFilter, setModelFilter] = useState([]);
    const [samplerFilter, setSamplerFilter] = useState([]);
    const [promptFilter, setPromptFilter] = useState([]);
    const [browserWidth, setBrowserWidth] = useState(440);
    const [infoWidth, setInfoWidth] = useState(window.innerWidth/2);
    const [viewerWidth, setViewerWidth] = useState(window.innerWidth - (browserWidth + infoWidth));
    const [cheatRender, setCheatRender] = useState(uniqid());

    const getAll = () => {
        return all;
    }

    socket.off('newImage');
    socket.on('newImage', (data) => {
        console.log(data);
        let _all = [...getAll()];
        _all.unshift(data);
        setAll(_all);
        eventBus.emit('selectImage', data);
        eventBus.emit('selectTabImage', data);
    });

    const eventBus = new EventEmitter();

    const filter = async () => {

        const data = {};
        if (filterModelValue !== "") data['model'] = filterModelValue;
        if (filterSamplerValue !== "") data['sampler'] = filterSamplerValue;
        if (filterPromptValue !== "") data['prompt'] = filterPromptValue;

        const fetched = await fetch(
            'http://localhost:6969/img/query',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }


        );

        const reader = fetched.body.getReader();

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

        let _all = JSON.parse(await blob.text());
        setAll(
            //TODO change value returned by server to avoid Object.values
            Object.values(_all)
        );

    }

    const _genericSuggestBoxLoad = async (what, query, stateSetFunc) => {
        const fetchPrompt = await fetch(`http://localhost:6969/img/filter/${what}`);
        const fetchPromptJson = JSON.parse(await fetchPrompt.text())
        stateSetFunc(
            fetchPromptJson.filter(val => val.indexOf(query) >= 0)
        );
    }

    const loadPrompt2Img = async (e) => {
        await _genericSuggestBoxLoad('prompt',e.query, setPromptFilter);
    }

    const loadSampler2Img = async (e) => {
        await _genericSuggestBoxLoad('sampler',e.query, setSamplerFilter);
    }

    const loadModel2Img = async (e) => {
        await _genericSuggestBoxLoad('model',e.query, setModelFilter);
    }

    useEffect(() => {
        filter();
    }, [filterPromptValue, filterSamplerValue, filterModelValue]);


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

        const filtered = [];
        for (let hash of all) {
            const imgData = all[hash];

            if (JSON.stringify(imgData.generationMetadata).includes(searchValue)) {
                filtered.push(imgData);
            }
            else if (JSON.stringify(imgData.paths).includes(searchValue)) {
                filtered.push(imgData);
            }

        }
        return filtered;
    }

    function getAutoCompleteElement(title, value, suggestion, completeMethod, onChange) {
        return (
            <div>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">{title}</span>

                        <AutoComplete value={value} suggestions={suggestion} completeMethod={completeMethod}
                                      dropdown multiple onChange={onChange} aria-label="Prompts"
                                      dropdownAriaLabel="Select Prompts"/>


                </div>
            </div>

        );
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
            template: (item, options) => {
                return getAutoCompleteElement('Model', filterModelValue, modelFilter, loadModel2Img, (e) => setFilterModelValue(e.value));
            }
        },
        {
            template: (item, options) => {
                return getAutoCompleteElement('Sampler', filterSamplerValue, samplerFilter, loadSampler2Img, (e) => setFilterSamplerValue(e.value));
            }
        },
        {
            template: (item, options) => {
                return getAutoCompleteElement('Prompt', filterPromptValue, promptFilter, loadPrompt2Img, (e) => setFilterPromptValue(e.value));
            }
        },

        {
            label:'Refresh',
            icon:'pi pi-fw pi-refresh',
            command:() => fetch('http://localhost:6969/refresh')
        }
    ];

    const _filterRef = {
        model:{
            value:filterModelValue,
            set:setFilterModelValue
        },
        sampler:{
            value:filterSamplerValue,
            set:setFilterSamplerValue
        }
    }

    return (
        <div style={{height: '100vh', display:'flex', flexDirection:'column'}}>
            <span style={{display:"none"}}>{cheatRender}</span>
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
            <div style={{height: 'calc(100% - 65px)', display:'flex'}}>

                <Resizable width={browserWidth} id='browserSplitterPanel'
                        style={{display:'flex', flexDirection:'column', paddingRight:'10px'}}
                        resizeHandles={['ne']}
                        onResize={onFirstResizeBrowser}>

                    <div style={{width:browserWidth+"px", height:'100%'}}>
                        <h4>Browser</h4>
                        <Browser all={applySearch()} eventBus={eventBus}/>
                    </div>

                </Resizable>

                <div style={{display: 'flex', flexDirection:'column', flex:1, height:"100%", maxWidth:viewerWidth+'px', padding:"0 5px 0 5px"}}>
                    <h4>Viewer</h4>
                    <div style={{display:'flex'}}>
                        <Viewer eventBus={eventBus}/>
                        <ImgData eventBus={eventBus} _filterRef={_filterRef} marginRight={`${infoWidth+10}px`}/>
                    </div>
                </div>

                <div style={{display: 'flex', flexDirection:'column'}}>

                    <Resizable width={infoWidth} id='browserSplitterPanel'
                               style={{display:'flex', flexDirection:'column', paddingRight:'10px'}}
                               resizeHandles={['nw']}
                               onResize={onFirstResizeInfo}>

                        <div style={{width:infoWidth+"px", height:'100%'}}>
                            <h4>Automatic1111</h4>
                            <iframe id="automatic1111-iframe" style={{height: 'inherit', width: "inherit"}} src="http://127.0.0.1:7860"/>
                        </div>

                    </Resizable>

                </div>
            </div>
        </div>
    );
}

export default App;
