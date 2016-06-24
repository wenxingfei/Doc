define([
    "json!/config/config.json",
    "../../webix/editable"
], function(config){
    var _seletedItem;
    var _elements;
    var _configData;
    
    function onWinShow(){
        /*var markerCss = webix.html.createCss({
            "border-top": "1px dashed orange",
            "width": "100%",
            "height": "1px",
            "position": "absolute",
            "left": "0px",
            "display": "none"
        });
        var marker = webix.html.create("div", { "class": markerCss }, "&nbsp");
        this.$view.appendChild(marker);
        webix.extend($$("edit_config_tree"), {
            $dragMark:function(context, ev){
                marker.style.display = 'none';

                if (context.target){
                    var pos = webix.html.offset(ev.target);
                    var box = webix.html.offset(this.$view);

                    marker.style.display = 'block';
                    marker.style.top = ev.target.offsetTop + "px";//pos.y+"px";
                    marker.style.left = ev.target.offsetLeft + "px";//box.x+"px";
                    marker.style.width = this.$view.offsetWidth +"px";
                }	
            }
        }, true);*/
        
        //var columns = Object.keys(_seletedItem);
        // var result = webix.ajax().sync().get("/api/jxgj/data/columns/");
        // var columns = JSON.parse(result.responseText);
        var columnNames = ["工号Employee ID", "姓名Full Name", "英文名En Name"];
        _elements = [];
        _.each(columnNames, function(column){
            var element = {
                view: "text",
                //id: column.replace(/[\r\n]/g, ""),
                name: column,
                label: column,
                width: 350
            };
            _elements.push(element);
        });
        
        var result = webix.ajax().sync().get('/api/jxgj/data/formConfig/' + config.currentUser.userId);
        _configData = JSON.parse(result.responseText);
        if(_.isEmpty(_configData)){
            _configData = {
                userId: config.currentUser.userId,
                tabs: [
                    { 
                        label: "Tab1", open: true, data: [
                            { view: "text", name: "工号Employee ID", label: "工号Employee ID", width: 350 },     
                            { view: "text", name: "姓名Full Name", label: "姓名Full Name", width: 350 },
                        ]
                    },
                    {
                        label: "Tab2", open: true, data: [
                            { view: "text", name: "英文名En Name", label: "英文名En Name", width: 350 }
                        ]
                    }
                ]
            };
            webix.ajax().post("/api/jxgj/data/formConfig", _configData, function(text, data, xml){
                var result = data.json();
                _configData.id = result.newid;
            });
        }
        
        
        initViews();
    }
    
    function initViews(){
        var showedElements = [];
        _.each(_configData.tabs, function(tab){
            showedElements = showedElements.concat(tab.data);
        });
        var hiddenElements = [];
        _.each(_elements, function(element){
            if(_.findIndex(showedElements, {name: element.name}) < 0) {
                hiddenElements.push(element);
            }
        });
        $$(configTree.id).clearAll();
        $$(configList.id).clearAll();
        $$(configTree.id).define('data', _configData.tabs);
        $$(configList.id).define('data', hiddenElements);
        
        // 删除已有的Tab页
        var options = $$('edit_tabbar').config.options;
        var optids = _.map(options, function(opt){ return opt.id; });       
        _.each(optids, function(id) { $$('edit_tabbar').removeOption(id); });
        var cells = $$('edit_tab_multiview').getChildViews();
        var cellids = _.map(cells, function(cell) { return cell.config.id; });
        $$('edit_tab_multiview').setValue('edit_tabview_default'); // 先显示默认的，不然其他cell时会出错
        _.each(cellids, function(id) {
            // 删除所有会出错，所以保留一个默认的
            if(id == 'edit_tabview_default') return;
            $$('edit_tab_multiview').removeView(id); 
        });
        
        // 构建新的Tab页
        var tabOptions = genterateTabOptions();
        var tabCells = genterateTabCells();
        _.each(tabOptions, function(option) { $$('edit_tabbar').addOption(option); });
        _.each(tabCells, function(cell) { 
            $$('edit_tab_multiview').addView(cell); 
        });
        $$('edit_tabbar').setValue(tabCells[0].id);
        $$('edit_tab_multiview').setValue(tabCells[0].id);
    }
    
    {// ConfigView
        
        {// Tree
            var configTreeToolbar = {
                height: 40,
                cols: [
                    { view: "label", width: 80, label: "显示项" },
                    {},
                    { view: "button", width: 80, label: "添加页签", click: onAddTreeNodeBtnClick }
                ]
            }
            
            var configTree = {
                view: "edittree",
                id: "edit_config_tree",
                editable: true,
                editaction: "dblclick",
                editor: "text",
                editValue: "label",
                select: true,
                drag: true,
                gravity: 0.4,
                template: "{common.icon()} {common.folder()} <span>#label#</span>",
                //data: _configData.tabs,
                rules: {
                    label : function(value){
                        if(!value.trim()) return false;
                        return true;
                    }
                },
                on: {
                    onBeforeSelect: onTreeItemBeforeSelect,
                    onBeforeDrop: onTreeBeforeDrop,
                    onAfterDrop: onTreeAfterDrop,
                    onValidationError: function(id, obj, details){
                    }
                }
            };
            
            function onTreeItemBeforeSelect(id, selection) {
                var parentId = this.getParentId(id);
                if(parentId) return false;
                return true;
            }
            
            function onTreeBeforeDrop(context, e){
                var targetItem = this.getItem(context.target);
                var sourceItem = this.getItem(context.start);
                if(!targetItem) return false;
                if (targetItem.$level == 1 && !(sourceItem && sourceItem.$level == 1)){
                    context.parent = context.target;
                    context.index = 0;
                }
            }
            
            function onTreeAfterDrop(context, e){
                var targetItem = this.getItem(context.target);            
                if (targetItem && targetItem.$level == 1){
                    this.close(context.target);
                    this.open(context.target); 
                }
                
                var brotherNodes = this.find({$parent: context.parent});
                brotherNodes.sort(function(a,b){
                    var index1 = $$('edit_config_tree').getIndexById(a.id);
                    var index2 = $$('edit_config_tree').getIndexById(b.id);
                    return index1 < index2 ? -1 : 1;
                });
                for(var i = 0; i < brotherNodes.length; i++){
                    brotherNodes[i].seq = i + 1;
                }
            }
            
            function onAddTreeNodeBtnClick(){
                var newNode = {label: "New Tab", open: true, data: []};
                $$('edit_config_tree').add(newNode);
                $$('edit_config_tree').edit(newNode.id);
            }
        }
        
        {// List
            var configListHeader = {
                cols: [
                    { view: "label", width: 80, label: "可选项" },
                    {}
                ]
            }
            
            var configList = {
                view: "list",
                id: "edit_config_list",
                template: "#label#",
                select: true,
                drag: true,
                //data: _configData.extends,
                on: {
                    onBeforeDrop: onListBeforeDrop
                }
            };
            
            function onListBeforeDrop(context, e){
                var sourceItem = this.getItem(context.start);
                if(!sourceItem){
                    // 不允许拖动一级树节点到列表
                    sourceItem = $$('edit_config_tree').getItem(context.start);
                    if(sourceItem.$level == 1) return false;
                }
            }
        }
        
        var configView = {
            id: "edit_config_layout",
            height: 400,
            borderless: false,
            rows: [
                { view: "label", label: "请把要显示的项拖动到对应的页签节点" },
                {
                    cols: [
                        {
                            gravity: 0.35,
                            rows: [
                                configTreeToolbar,
                                configTree
                            ]
                        },
                        { view: "resizer" },
                        {
                            rows: [
                                configListHeader,
                                configList 
                            ]
                        }                        
                    ]
                }
            ]            
        };
        
        function saveConfig(){
            // 按照顺序获取树节点
            var data = []; 
            var nextId = $$("edit_config_tree").getNextId();
            while(nextId){
                data.push($$("edit_config_tree").getItem(nextId));
                nextId = $$("edit_config_tree").getNextId(nextId);
            }
            
            _configData.tabs = [];
            var tabIndex = 0;
            _.each(data, function(node){
                if(!node.$parent){
                    var tab = {};
                    tab.seq = ++tabIndex
                    tab.id = node.id;
                    tab.label = node.label;
                    tab.open = true;
                    tab.data = [];
                    _configData.tabs.push(tab);
                } else {
                    var element = {};
                    element.id = node.id;
                    element.view = node.view;
                    element.name = node.name;
                    element.label = node.label;
                    element.width = node.width;
                    var tab = _.find(_configData.tabs, {id: node.$parent});
                    tab.data.push(element);
                }
            });
            
            webix.ajax().put("/api/jxgj/data/formConfig/" + _configData.id, _configData);

            initViews();    
        }
    }
    
    {//TabView
        var tabview = { 
            id: "edit_tabview",
            height: 400,
            rows:[
                {
                    view:"tabbar", id:'edit_tabbar', value:'edit_tabview_default', multiview:true, options: [
                        { id: 'edit_tabview_default', value: "" },
                    ]
                },
                {
                    view:"multiview", id:"edit_tab_multiview", animate:false, cells:[
                        { id:"edit_tabview_default", template:"" },
                    ]
                }
            ]
        }

        function genterateTabOptions(){
            var options = [];
            _.each(_configData.tabs, function(tab){
                var option = { id: tab.id, value: tab.label, width: 100 };
                options.push(option);
            });
            return options;
        }
        
        function genterateTabCells(){
            var cells = [];
            _.each(_configData.tabs, function(tab){
                var scrollview = { view: "scrollview", id: tab.id, body:{} };
                var rows = [];
                var nodes = $$("edit_config_tree").find({$parent: tab.id});
                nodes.sort(function(a,b){ return a.seq < b.seq ? -1 : 1; });
                var elements = _.map(nodes, function(node){
                    return {
                        view: node.view,
                        //id: node.id,
                        name: node.name,
                        label: node.label,
                        width: node.width,
                        readonly: true
                    }
                });
                for(var i = 0; i < elements.length; i++){
                    var cols = [];
                    cols.push(elements[i]);
                    if(++i < elements.length){
                        cols.push(elements[i]);
                    }
                    rows.push({ margin: 10, cols: cols });
                }     
                scrollview.body.rows = rows;
                cells.push(scrollview);
            });
            return cells;
        }
    }
    
    {//Btns
        var btns = {
            margin: 10,
            cols: [
                { view: "button", id: "edit_set_config", label: "配置", align: "center", width: 120, click: onSetConfigBtnClick },
                { view: "button", id: "edit_save_config", label: "保存配置", align: "center", width: 120, hidden: true, click: onSaveConfigBtnClick },            
                {},
                { view: "button", label: "保存", type: "form", align: "center", width: 120, click: onSaveBtnClick },                        
                { view: "button", label: "取消", align: "center", width: 120, click: '$$("edit_win").close()' },
                {}
            ]
        };
        
        function onSetConfigBtnClick(){
            $$(configView.id).show();
            $$("edit_save_config").show();
            $$("edit_set_config").hide();
        }
        
        function onSaveConfigBtnClick(){
            $$(tabview.id).show();
            $$("edit_set_config").show();
            $$("edit_save_config").hide();
            saveConfig();
        }
    
        function onSaveBtnClick(){
        }
    }
    
    var popup = {
        view: "window",
        id: "edit_win",        
        modal: true,
        position: "center",
        head: "编辑",
        body: {
            width: 800,
            elementsConfig: { labelWidth: 140 },
            view: "form",
            id: "edit_form",
            rules: {
            },
            elements: [
                {
                    id: "edit_content",
                    cells: [
                        tabview,
                        configView
                    ]
                },
                { view: "text", id: "评价", name: "评价", label: "评价" },
                btns
            ]
        },
        on: {
            onShow: onWinShow
        }
    };
    
    return {
        show: function(scope, row){
            _seletedItem = row;
            scope.ui(popup).show();            
        }
    }
});