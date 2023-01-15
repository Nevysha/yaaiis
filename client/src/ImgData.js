import {useState} from "react";
import uniqid from "uniqid";

function ImgData(props) {

    const eventBus = props.eventBus;

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

    return (
        <div className="imgData">
            <span style={{display:"none"}}>{cheatRender}</span>
            <table>
                <tbody>
                {imgData.generationMetadata.map((metadata) => {
                    return (
                        <tr key={metadata.key}>
                            <td>
                                <div style={{fontWeight:'bold',color: '#c298d8',marginRight:'10px'}}>
                                    {metadata.key}
                                </div>
                            </td>
                            <td>{metadata.val}</td>
                        </tr>
                    )
                })}

                <tr key="path_1">
                    <td>
                        <div style={{fontWeight:'bold',color: '#c298d8',marginRight:'10px'}}>
                            Path
                        </div>
                    </td>
                    <td>{imgData.paths[0]}</td>
                </tr>

                </tbody>
            </table>

        </div>
    )
}

export default ImgData;