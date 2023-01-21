import {useState} from "react";
import uniqid from "uniqid";
import {AutoComplete} from "primereact/autocomplete";

function ImgData(props) {

    const eventBus = props.eventBus;
    const marginRight = props.marginRight;
    const completeTags = props.completeTags;

    const [imgData, setImgData] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagsFilter, setTagsFilter] = useState([]);
    const [cheatRender, setCheatRender] = useState(uniqid());

    eventBus.removeAllListeners('selectTabImage');
    eventBus.on('selectTabImage', async (_imgData) => {

        let _loadImgData = await fetch(`http://localhost:6969/img/data/${_imgData.hash}`);
        _loadImgData = await _loadImgData.text();
        let _loadImgDataJson = JSON.parse(_loadImgData);


        setImgData(_loadImgDataJson);
        setTags(_loadImgDataJson.Tags.map(_tag => _tag.name))
        setCheatRender(uniqid());
    })

    if (!imgData || !imgData.generationMetadata) {
        return (<div/>)
    }

    const filterable = ['model','sampler'];

    function transfer() {

        document
            .getElementById('automatic1111-iframe')
            .contentWindow
            .postMessage({
                type: 'yaaiis/message',
                data:imgData,
                where:'txt2img'
            }, 'http://127.0.0.1:7860')

        // fetch(
        //     "http://127.0.0.1:7860/sdapi/v1/txt2img",
        //     {
        //         method: 'POST',
        //         mode:'no-cors',
        //         headers:new Headers({
        //             'Accept': 'application/json',
        //             'Content-Type': 'application/json'
        //         }),
        //         body: JSON.stringify({prompt:imgData.prompt})
        //     }
        // );
    }

    return (
        <div className="imgData" style={{right:marginRight}}>
            <span style={{display:"none"}}>{cheatRender}</span>
            <div>
                {imgData.generationMetadata.map((metadata) => {
                    return (
                        <div key={metadata.key} className='imgData-row'>

                                <span className='imgData-row-label'>
                                    {metadata.key}
                                </span>
                                {filterable.indexOf(metadata.key) < 0 && metadata.val}
                                {filterable.indexOf(metadata.key) >= 0 && (
                                    <button onClick={() => {
                                        props._filterRef[metadata.key].set([metadata.val])
                                    }}>{metadata.val}</button>
                                )}
                        </div>
                    )
                })}

                <div key="path_1" className='imgData-row'>
                    <div className='imgData-row-label' style={{fontWeight:'bold',color: '#c298d8',marginRight:'10px'}}>
                        Path
                    </div>
                    <div>{imgData.paths[0]}</div>
                </div>
            </div>
            <div className="imgData-button-sendTo">
                <button
                    onClick={() => {
                        transfer();
                    }}>
                    txt2img
                </button>
                <button>img2img</button>
                <button>extras</button>
            </div>
            <div className="p-inputgroup" style={{marginTop:'5px'}}>
                <span className="p-inputgroup-addon">Tags</span>

                <AutoComplete value={tags} suggestions={tagsFilter} completeMethod={completeTags}
                              multiple onChange={(e) => setTags(e.value)} aria-label="Prompts"
                              dropdownAriaLabel="Select Prompts"/>


            </div>
        </div>
    )
}

export default ImgData;