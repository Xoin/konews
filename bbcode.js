const tags = {}
const block_tags = {}
const noparse_tags = {}
tags.b = (obj)=>{
    return "<b>"+obj.content+"</b>"
}
tags.u = (obj)=>{
    return "<u>"+obj.content+"</u>"
}
tags.i = (obj)=>{
    return "<i>"+obj.content+"</i>"
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

tags.code = (obj)=>{
    return "<div class='code'><pre>"+obj.content+"</pre></div>"
}

function render (text) {
    let temptext = ""
    let render = render_bbcode(parse_bbcode(text, tags,2));
    render.forEach(element => {
        temptext+=element
    });
    temptext = temptext.replace(/\n/g, '<br>')
    return temptext;
};

module.exports = {
    render: render
};