function Browser(props) {

    const all = props.all;
    const eventBus = props.eventBus;

    const sendToViewer = (imgData) => {
        eventBus.emit('selectImage', imgData);
        eventBus.emit('selectTabImage', imgData);
    }

    return (
        <div style={{overflowY:'scroll'}}>
            {all.map((imgData) => {
                return (<img loading="lazy"
                             key={imgData.hash}
                             onClick={() => sendToViewer(imgData)}
                             width="100"
                             src={`http://localhost:6969/img/${imgData.hash}`} alt={imgData.hash}/>)
            })}
        </div>
    )
}

export default Browser;