import {useState} from "react";
import uniqid from "uniqid";

function ImgData(props) {

    const eventBus = props.eventBus;
    const marginRight = props.marginRight

    const [imgData, setImgData] = useState([]);
    const [cheatRender, setCheatRender] = useState(uniqid());

    eventBus.removeAllListeners('selectTabImage');
    eventBus.on('selectTabImage', (_imgData) => {
        setImgData(_imgData);
        setCheatRender(uniqid());
    })

    if (!imgData || !imgData.generationMetadata) {
        return (<div/>)
    }

    const filterable = ['model','sampler'];

    return (
        <div className="imgData" style={{right:marginRight}}>
            <span style={{display:"none"}}>{cheatRender}</span>
            <div>
                {imgData.generationMetadata.map((metadata) => {
                    return (
                        <div key={metadata.key} className='imgData-row'>

                            <div>
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
                        </div>
                    )
                })}

                <div key="path_1" className='imgData-row'>
                    <div>
                        <div className='imgData-row-label' style={{fontWeight:'bold',color: '#c298d8',marginRight:'10px'}}>
                            Path
                        </div>
                    </div>
                    <td>{imgData.paths[0]}</td>
                </div>
            </div>

        </div>
    )
}

export default ImgData;