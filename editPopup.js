define([
    "json!/config/config.json",
    "../../webix/editable"
], function(config){
    var _tableId;
    var _seletedItem;
    var _elements;
    var _configData;
    
    function onWinShow(){
        initData();
        initConfigView(this.$scope);
        initTabView();
        initEditForm();
    }
    
    function initData(){
        // 获取所有表格列
        //var columns = Object.keys(_seletedItem);
        // var result = webix.ajax().sync().get("/api/jxgj/data/columns/");
        // var columns = JSON.parse(result.responseText);
        var columnNames = ["工号Employee ID", "姓名Full Name", "英文名En Name", "建议权评价等级", "建议权评价文字意见", 
                            "劳动态度评价等级", "劳动态度评价文字意见", "绩效排名"];
        var editColNames = ["建议权评价等级", "建议权评价文字意见", "劳动态度评价等级", "劳动态度评价文字意见", "绩效排名"];
        var readColNames = _.filter(columnNames, function(name) {
            return _.indexOf(editColNames, name) < 0;
        });
        _elements = [];
        _.each(readColNames, function(column){
            var element = {
                view: "text",
                //id: column.replace(/[\r\n]/g, ""),
                name: column,
                label: column
            };
            _elements.push(element);
        });
        
        // 获取上次的表单配置数据
        var result = webix.ajax().sync().get('/api/jxgj/data/formConfig/' + config.currentUser.userId);
        _configData = JSON.parse(result.responseText);
        if(_.isEmpty(_configData)){
            var tabs = [];
            for(var i = 0; i < elements.length; i++){
                
            }
            
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
    }
    
    function initTabView(){
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
        
        bindFormData("edit_info_form");
    }
    
    function initConfigView(scope){
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
        scope.ui(configTreeMenu).attachTo($$('edit_config_tree'));
        
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
    }
    
    function initEditForm(){
        if(_.indexOf(columnNames, "劳动态度评价等级") < 0){
            $$('edit_form').elements["劳动态度评价等级"].hide();
        }
        if(_.indexOf(columnNames, "劳动态度评价文字意见") < 0){
            $$('edit_form').elements["劳动态度评价文字意见"].hide();            
        }
        if(_.indexOf(columnNames, "绩效排名") < 0){
            $$('edit_form').elements["绩效排名"].hide();            
        }
        
        var form = $$('edit_form');
        var jyqLevelColName = _.find(Object.keys(_seletedItem), function(key){ return key.indexOf("建议权评价等级") == 0; });
        var jyqyjColName = _.find(Object.keys(_seletedItem), function(key){ return key.indexOf("建议权评价文字意见") == 0; });        
        var ldtdLevelColName = _.find(Object.keys(_seletedItem), function(key){ return key.indexOf("劳动态度评价等级") == 0; });
        var ldtdyjColName = _.find(Object.keys(_seletedItem), function(key){ return key.indexOf("劳动态度评价文字意见") == 0; });
        var jxpmColName = _.find(Object.keys(_seletedItem), function(key){ return key.indexOf("绩效排名") == 0; });  
        form.elements["建议权评价等级"] = _seletedItem[jyqLevelColName];
        form.elements["建议权评价文字意见"] = _seletedItem[jyqyjColName];
        form.elements["劳动态度评价等级"] = _seletedItem[ldtdLevelColName];
        form.elements["劳动态度评价文字意见"] = _seletedItem[ldtdyjColName];
        form.elements["绩效排名"] = _seletedItem[jxpmColName];
    }
    
    function bindFormData(formId){
        //一般情况，在窗口显示后执行了bind操作才表格的行才会被选中，但是这是随机的，有时候这个顺序会颠倒，
        // 这样就会绑定失败，所以为了能成功绑定表单数据，先执行unselect操作，等执行完bing操作再执行select操作
        var table = $$(_tableId);
        table.unselectAll();
        $$(formId).bind(table);
        table.select(_seletedItem.id);
    }
    
    {// ConfigView
        
        {// Tree
            var configTreeToolbar = {
                height: 40,
                padding: 5,
                cols: [
                    { view: "label", width: 80, label: "显示字段" },
                    {},
                    { view: "button", width: 80, label: "添加页签", click: onAddTreeNodeBtnClick }
                ]
            }
            
            var configTreeMenu = {
                view: "contextmenu",
                id: "edit_config_tree_menu",
                data: ["删除"],
                on: {
                    onItemClick: onTreeMenuClick
                }
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
                // gravity: 0.4,
                template: "{common.icon()} {common.folder()} <span>#label#</span>",
                //data: _configData.tabs,
                rules: {
                    label : function(value){
                        if(!value.trim()) return false;
                        return true;
                    }
                },
                on: {
                    onBeforeDrop: onTreeBeforeDrop,
                    onAfterDrop: onTreeAfterDrop,
                    onBeforeContextMenu: onBeforeContextMenu,
                    onValidationError: function(id, obj, details){
                    }
                }
            };

            function onTreeBeforeDrop(context, e){
                var targetItem = this.getItem(context.target);
                var sourceItem = this.getItem(context.start);
                if(!targetItem) return false;
                if(sourceItem && sourceItem.$level == 1 && targetItem.$level > 1) return false;
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
            
            function onBeforeContextMenu(id, e, node) {
                var item = this.getItem(id);
                if(item.$level > 1) {
                    // return false;
                    $$('edit_config_tree_menu').clearAll();
                    $$('edit_config_tree_menu').parse(["移除"]);
                } else {
                    $$('edit_config_tree_menu').clearAll();
                    $$('edit_config_tree_menu').parse(["删除"]);
                }
                this.select(id);
                return true;
            }
            
            function onTreeMenuClick(id){
                var menuText = this.getItem(id).value;
                var tree = $$('edit_config_tree');
                var list = $$('edit_config_list');
                var item = tree.getSelectedItem();
                if(menuText == "删除"){
                    webix.confirm("是否删除该页签？", function(res){
                        if(res){
                            var children = tree.find({$parent: item.id});
                            tree.remove(item.id);
                            list.parse(children);
                        }
                    });
                } else if(menuText == "移除"){
                    tree.remove(item.id);
                    list.parse(item);
                }
            }
        }
        
        {// List
            var configListHeader = {
                height: 40,
                padding: 5,
                cols: [
                    { view: "label", width: 80, label: "可选字段" },
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
            id: "edit_config_view",
            height: 530,
            borderless: false,
            rows: [
                { view: "label", label: "请把要显示的字段拖动到对应的页签节点" },
                {
                    cols: [
                        {
                            gravity: 0.5,
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
                    var tab = _.find(_configData.tabs, function(obj){ return obj.id == node.$parent;});
                    tab.data.push(element);
                }
            });
            
            webix.ajax().put("/api/jxgj/data/formConfig/" + _configData.id, _configData);

            initTabView();    
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
                    view: "form",
                    id: "edit_info_form",
                    padding: 0,
                    elements: [
                        {
                            view:"multiview", id:"edit_tab_multiview", animate:false, cells:[
                                { id:"edit_tabview_default", template:"" },
                            ]
                        }
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
                var nodes = $$("edit_config_tree").find({$parent: tab.id});
                var rows = genterateTabCellElements(nodes);
                scrollview.body.rows = rows;
                cells.push(scrollview);
            });
            return cells;
        }
        
        function genterateTabCellElements(nodes){
            nodes.sort(function(a,b){ return a.seq < b.seq ? -1 : 1; });
            var elements = _.map(nodes, function(node){
                return {
                    view: node.view,
                    //id: node.id,
                    name: node.name,
                    label: node.label,
                    tooltip: node.label,
                    labelWidth: 130,
                    width: 360,
                    readonly: true
                }
            });
            var rows = [];
            for(var i = 0; i < elements.length; i++){
                var cols = [];
                cols.push(elements[i]);
                if(++i < elements.length){
                    cols.push(elements[i]);
                }
                rows.push({ margin: 10, cols: cols });
            }
            return rows; 
        }
    }
    
    {//Edit Elements
        var editForm = {
            elementsConfig: { labelWidth: 140 },
            view: "form",
            id: "edit_form",
            rules: {
            },
            elements: [
                 {
                    cols: [
                        { view: "richselect", id: "建议权评价等级", name: "建议权评价等级", label: "建议权评价等级", labelWidth: 150, 
                            options: ["A", "B+", "B", "C", "D"] },
                        { view: "richselect", id: "劳动态度评价等级", name: "劳动态度评价等级", label: "劳动态度评价等级", labelWidth: 150, 
                            options: ["A", "B", "C"] }, 
                    ]
                },
                {
                    cols: [
                        { view: "textarea", id: "建议权评价文字意见", name: "建议权评价文字意见", label: "建议权评价文字意见", labelWidth: 150 },
                        { view: "textarea", id: "劳动态度评价文字意见", name: "劳动态度评价文字意见", label: "劳动态度评价文字意见", 
                            tooltip: "劳动态度评价文字意见", labelWidth: 150 },
                    ]
                },
                {
                    cols: [
                        { view: "text", id: "绩效排名", name: "绩效排名", label: "绩效排名", labelWidth: 150, width: 380 }
                    ]
                }
            ]
        }
    }
    
    {//Btns
        var btns = {
            margin: 10,
            padding: 10,
            cols: [
                { view: "button", id: "edit_set_config", label: "配置", align: "center", width: 120, click: onSetConfigBtnClick },
                { view: "button", id: "edit_save_config", label: "保存配置", align: "center", width: 120, hidden: true, click: onSaveConfigBtnClick },
                {},
                { view: "button", label: "保存", type: "form", align: "center", width: 120, click: onSaveBtnClick },                        
                { view: "button", label: "取消", align: "center", width: 120, click: '$$("edit_win").close()' },
            ]
        };
        
        function onSetConfigBtnClick(){
            $$("edit_config_view").show();
            $$("edit_save_config").show();
            $$("edit_set_config").hide();
        }
        
        function onSaveConfigBtnClick(){
            $$("edit_content").show();
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
            rows: [
                {
                    cells: [
                        {
                            id: "edit_content",
                            rows: [
                                tabview,
                                editForm,
                            ]
                        },
                        configView
                    ]
                },
                btns
            ]
        },
        on: {
            onShow: onWinShow
        }
    };
    
    return {
        set tableId(id){
            _tableId = id;
        },
        show: function(scope, row){
            _seletedItem = row;
            scope.ui(popup).show();            
        }
    }
});