function Browser(props) {

    const all = props.all;
    const eventBus = props.eventBus;

    const sendToViewer = (hash) => {
        eventBus.emit('selectImage', all[hash]);
    }

    return (
        <div style={{overflowY:'scroll'}}>
            {Object.keys(all).map((hash) => {
                return (<img loading="lazy" key={hash} onClick={() => sendToViewer(hash)} width="100" src={`http://localhost:6969/img/${hash}`} alt={hash}/>)
            })}
        </div>
    )
}

export default Browser;