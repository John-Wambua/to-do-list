
const express=require('express');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');

const _=require('lodash');

const port=3000;
const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'))

mongoose.connect('mongodb://localhost/todolistDB',{useNewUrlParser: true,useUnifiedTopology:true});

const itemsSchema=mongoose.Schema({
    name:String,
})
const Item=mongoose.model('Item',itemsSchema);

app.set('view engine', 'ejs');

const item1=new Item({
    name:'This is my to-do list'
});
const item2=new Item({
    name:'Made with Node.js'
});
const item3=new Item({
    name:'You are welcome to use it'
});

const defaultItems=[item1,item2,item3];

const listSchema={
    name:String,
    items:[itemsSchema]
};

const List=mongoose.model('List',listSchema);


app.get('/',(req,res)=>{

    Item.find({},(err,items)=>{

        if(items.length==0){
            Item.insertMany(defaultItems,err=>{
                if(err){
                    console.log(err);
                }else{
                    console.log('Successfully added the items into our items collection');
                }
            });
            res.redirect('/');
        }else{
            res.render('list', {listTitle: 'Today',newListItems:items});
        }


    });

});

app.post('/',(req,res)=>{
    const itemName=req.body.newItem;
    const listName=req.body.list;

    const item=new Item({
        name:itemName
    });

    if(listName=='Today'){
        item.save();
        res.redirect('/');
    }else{
        List.findOne({name:listName},(err,foundList)=>{
            foundList.items.push(item)
            foundList.save();
            res.redirect(`/${listName}`);
        })
    }


});


app.get('/:customListName',(req,res)=>{
    customListName=_.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList)=> {
        if(!err){
            if(!foundList){
                //Create new list
                const list=new List({
                    name:customListName,
                    items:defaultItems,
                });
                list.save();
                res.redirect(`/${customListName}`);
            }else {

                res.render('list',{listTitle: foundList.name,newListItems:foundList.items})
                //Show existing list
            }
        }
    });

});


app.post('/delete',(req,res)=>{
   const checkedItemId=req.body.checkbox;
   const listName=req.body.listName;

   if(listName=='Today'){
       Item.findByIdAndRemove(checkedItemId, err=>{
           if(err){
               console.log(err)
           }else{
               console.log('Successfully deleted checked item')
           }
           res.redirect('/');
       })
   }else{
       List.findOneAndUpdate(
           {name:listName},
           {$pull:{items:{_id:checkedItemId}}},
           (err,foundList)=>{
           if(!err){
               res.redirect(`/${listName}`);
           }

       })
   }


});



app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
});