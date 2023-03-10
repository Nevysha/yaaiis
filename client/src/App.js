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
import { Button } from 'primereact/button';
import { Resizable } from 'react-resizable';
import uniqid from "uniqid";
import io from 'socket.io-client';
import useKeypress from 'react-use-keypress';

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
    const [filterTagValue, setFilterTagValue] = useState([]);

    const [all, setAll] = useState([]);
    const [modelFilter, setModelFilter] = useState([]);
    const [samplerFilter, setSamplerFilter] = useState([]);
    const [promptFilter, setPromptFilter] = useState([]);
    const [tagFilter, setTagFilter] = useState([]);
    const [browserWidth, setBrowserWidth] = useState(440);
    const [infoWidth, setInfoWidth] = useState(0);
    const [viewerWidth, setViewerWidth] = useState(window.innerWidth - (browserWidth + infoWidth));
    const [cheatRender, setCheatRender] = useState(uniqid());

    const [autoTag, setAutoTag] = useState('');

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
        if (filterModelValue !== "") data['tag'] = filterTagValue;
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

    const loadTag2Img = async (e) => {
        await _genericSuggestBoxLoad('tag',e.query, setTagFilter);
    }

    const loadSampler2Img = async (e) => {
        await _genericSuggestBoxLoad('sampler',e.query, setSamplerFilter);
    }

    const loadModel2Img = async (e) => {
        await _genericSuggestBoxLoad('model',e.query, setModelFilter);
    }

    useEffect(() => {
        filter();
    }, [filterPromptValue, filterSamplerValue, filterModelValue, filterTagValue]);

    useKeypress(['ArrowLeft', 'ArrowRight'], (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'ArrowLeft') {
            moveLeft();
        } else {
            moveRight();
        }
    });

    const moveLeft = () => {
        eventBus.emit('move', 'left');
    }

    const moveRight = () => {
        eventBus.emit('move', 'right');
    }


    const onFirstResizeBrowser = (event, {element, size, handle}) => {
        setBrowserWidth(size.width);
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
            <div style={{'-webkit-app-region': 'no-drag'}}>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">{title}</span>

                        <AutoComplete className="p-inputtext-sm block mb-2" value={value} suggestions={suggestion} completeMethod={completeMethod}
                                      dropdown multiple onChange={onChange} aria-label="Prompts"
                                      dropdownAriaLabel="Select Prompts"/>


                </div>
            </div>

        );
    }

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

    const applyAutoTag = async (value) => {
        console.log(`applyAutoTag:${value}`)
        setAutoTag(value);
        await fetch(`http://localhost:6969/autotag/${value}`);
    }

    const dragOverHandler = (ev) => {
        console.log("dragOver");
        ev.preventDefault();
    }

    const dropHandler = (ev) => {
        console.log("Drop");
        ev.preventDefault();
        // Get the data, which is the id of the drop target
        const data = ev.dataTransfer.getData("text");
        ev.target.appendChild(document.getElementById(data));
    }

    return (
        <div style={{height: '100vh', display:'flex', flexDirection:'column'}}>
            <span style={{display:"none"}}>{cheatRender}</span>

            <div className='yaaiis-menu' style={window.electron ? {'-webkit-app-region': 'drag'} : {'-webkit-app-region': 'no-drag'}}>
                <img src="./nevy-icon-1-256-round.png" width='40px' height='40px' style={window.electron ? {'display': 'none'} : {'-webkit-app-region': 'no-drag'}}/>
                <div className="p-inputgroup global-search" style={{'-webkit-app-region': 'no-drag'}}>
                    <span className="p-inputgroup-addon">
                        <FontAwesomeIcon icon={faSearch}/>
                    </span>
                    <InputText className="p-inputtext-sm block mb-2" placeholder="Search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)}/>
                </div>
                {getAutoCompleteElement('Tag', filterTagValue, tagFilter, loadTag2Img, (e) => setFilterTagValue(e.value))}
                {getAutoCompleteElement('Model', filterModelValue, modelFilter, loadModel2Img, (e) => setFilterModelValue(e.value))}
                {getAutoCompleteElement('Sampler', filterSamplerValue, samplerFilter, loadSampler2Img, (e) => setFilterSamplerValue(e.value))}
                {getAutoCompleteElement('Prompt', filterPromptValue, promptFilter, loadPrompt2Img, (e) => setFilterPromptValue(e.value))}
                <div style={{flex:'1'}}/>
            </div>

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
                    <div className="p-inputgroup" style={{marginTop:'5px',width:'400px'}}>
                        <span className="p-inputgroup-addon">Auto tag</span>

                        <InputText  value={autoTag} onChange={(e) => applyAutoTag(e.target.value)}/>


                    </div>

                    <h4>Viewer</h4>
                    <div style={{display:'flex'}}>
                        <Viewer eventBus={eventBus}/>
                        <ImgData eventBus={eventBus} _filterRef={_filterRef} marginRight={`${infoWidth+10}px`} completeTags={loadTag2Img}/>
                    </div>
                </div>

                {/*<div style={{display: 'flex', flexDirection:'column'}}>*/}

                {/*    <Resizable width={infoWidth} id='browserSplitterPanel'*/}
                {/*               style={{display:'flex', flexDirection:'column', paddingRight:'10px'}}*/}
                {/*               resizeHandles={['nw']}*/}
                {/*               onResize={onFirstResizeInfo}>*/}

                {/*        <div style={{width:infoWidth+"px", height:'100%'}}*/}
                {/*             onDrop={dropHandler}*/}
                {/*             onDragOver={dragOverHandler}>*/}
                {/*            <h4>Automatic1111</h4>*/}
                {/*            <iframe*/}
                {/*                id="automatic1111-iframe" style={{height: 'inherit', width: "inherit"}} src="http://127.0.0.1:7860"*/}
                {/*                />*/}
                {/*        </div>*/}

                {/*    </Resizable>*/}

                {/*</div>*/}
            </div>
        </div>
    );
}

export default App;
