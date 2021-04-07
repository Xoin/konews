const tags = {}
const block_tags = {}
const noparse_tags = {}
tags.b = (obj) => { return obj; }
tags.u = (obj) => { return obj; }
tags.i = (obj) => { return obj; }
tags.s = (obj) => { return obj; }
tags.h1 = (obj) => { return obj; }
tags.h2 = (obj) => { return obj; }
tags.h3 = (obj) => { return obj; }
tags.li = (obj) => { return obj; }
tags.ul = (obj) => { return obj; }
tags.ol = (obj) => { return obj; }
tags.img = (obj) => {return obj; }
tags.url = (obj) => {return obj; }
tags.twitter = (obj) => { return obj; }
tags.youtube = (obj) => { return obj; }
tags.vimeo = (obj) => { return obj; }
tags.streamable = (obj) => { return obj; }
tags.Strawpoll = (obj) => { return obj; }
tags.Vocaroo = (obj) => { return obj; }
tags.Spotify = (obj) => { return obj; }
tags.Twitch = (obj) => { return obj; }
tags.SoundCloud = (obj) => { return obj; }
tags.Reddit = (obj) => { return obj; }
tags.Instagram = (obj) => { return obj; }
tags.TikTok = (obj) => { return obj; }
tags.blockquote = (obj) => { return obj; }
tags.spoiler = (obj) => { return obj; }
tags.quote = (obj) => { return obj; }
tags.code = (obj) => { return obj; }
tags.newline = (obj) => { return { tag: "newline" } }

function find_first_of(text, items, start) {
    let min = -1
    for (const item of items) {
        let i = text.indexOf(item, start)
        if (min === -1 || (i !== -1 && i < min)) {
            min = i
}
}
    return min
}

tags.h1 = (obj)=>{
    return "<h1>"+obj.content+"</h1>"
}
tags.h2 = (obj)=>{
    return "<h2>"+obj.content+"</h2>"
}
tags.h3 = (obj)=>{
    return "<h3>"+obj.content+"</h3>"
}

tags.img = (obj)=>{
    if (obj.attrs.thumbnail)
    {
        return '<a href="'+obj.inner+'"><img class="thumb" src="'+obj.inner+'" /></a>'
    }
    else{
    return '<img src="'+obj.inner+'" />'
}

}

tags.url = (obj)=>{
    if(obj.inner=="")
    {
        return '<a href="'+obj.attrs.href+'">'+obj.attrs.href+'</a>'
    }
    else
    {
        return '<a href="'+obj.attrs.href+'">'+obj.content+'</a>'
    }
}

tags.twitter = (obj)=>{
    return '<a href="'+obj.content+'">'+obj.content+'</a>'
}

tags.youtube = (obj)=>{
    return '<a href="'+obj.content+'">'+obj.content+'</a>'
}

tags.blockquote = (obj)=>{
    return "<blockquote>"+obj.content+"</blockquote>"
}
tags.spoiler = (obj)=>{
    return "<spoiler>"+obj.content+"</spoiler>"
}

tags.quote = (obj)=>{
    return "<blockquote><userinfo><user>"+obj.attrs.username+"</user></userinfo>"+obj.content+"</blockquote>"
}

function render(text) {
    let temptext = text.replace(/\n/g, '[newline][/newline]')
    let result = []
    let ouput = render_bbcode(parse_bbcode(temptext, tags, 2))

    ouput.forEach(keep => {
        result.push(keep)
    });
    return result;
};

module.exports = {
    render: render
};