module txt {

    export class CharacterText extends createjs.Container{

        text:string = "";
        lineHeight:number = null;
        width:number = 100;
        height:number = 20;
        align:number = txt.Align.TOP_LEFT;
        characterCase:number = txt.Case.NORMAL;
        size:number = 12;
        minSize:number = 6;
        font:string = "belinda";
        spacing:number = 0;
        ligatures:boolean = false;
        fillColor:string = "#000";
        strokeColor:string = null;
        strokeWidth:number = null;
        autoSize:boolean = false;
        loaderId:number = null;
        style:Style[] = null;
        debug:boolean = false;

        lines:Line[] = [];
        block:createjs.Container;

        constructor( props:ConstructObj = null ){
            super();
            if( props ){
                this.set( props );
            }
            if( this.style == null ){
                txt.FontLoader.load( this , [ this.font ] );
            }else{
                var fonts = [ this.font ];
                var styleLength = this.style.length;
                for( var i = 0; i < styleLength; ++i ){
                    if( this.style[ i ] != undefined ){
                        if( this.style[ i ].font != undefined ){
                            fonts.push( this.style[ i ].font );
                        }
                    }
                }
                txt.FontLoader.load( this , fonts );
            }
        }

        //called when text is rendered
        complete(){}

        //called when font has loaded
        fontLoaded(){
            this.layout();
        }

        //call stage.update to render canvas
        //overload to support deferred rendering
        render(){
            this.getStage().update();
        }

        
        //layout text
        layout(){

            this.text = this.text.replace( /([\n][ \t]+)/g , '\n' );
            
            this.lines = [];

            this.removeAllChildren();

            if( this.text === "" || this.text === undefined ){
                this.render();
                this.complete();
                return;
            }

            this.block = new createjs.Container()
            this.addChild( this.block );
            var font:txt.Font = txt.FontLoader.getFont( this.font );
            if( this.debug == true ){
                
                //outline
                var s = new createjs.Shape();
                s.graphics.beginStroke( "#FF0000" );
                s.graphics.setStrokeStyle( 1.2 );
                s.graphics.drawRect( 0 , 0 , this.width , this.height );
                this.addChild( s );

                //baseline
                s = new createjs.Shape();
                s.graphics.beginFill( "#000" );
                s.graphics.drawRect( 0 , 0 , this.width , 0.2 );
                s.x = 0;
                s.y = 0;
                this.block.addChild( s );

                s = new createjs.Shape();
                s.graphics.beginFill( "#F00" );
                s.graphics.drawRect( 0 , 0 , this.width , 0.2 );
                s.x = 0;
                s.y = -font[ 'cap-height' ] / font.units * this.size;
                this.block.addChild( s );

                s = new createjs.Shape();
                s.graphics.beginFill( "#0F0" );
                s.graphics.drawRect( 0 , 0 , this.width , 0.2 );
                s.x = 0;
                s.y = -font.ascent / font.units * this.size;
                this.block.addChild( s );

                s = new createjs.Shape();
                s.graphics.beginFill( "#00F" );
                s.graphics.drawRect( 0 , 0 , this.width , 0.2 );
                s.x = 0;
                s.y = -font.descent / font.units * this.size;
                this.block.addChild( s );
            
            }
            if( this.autoSize == true ){
                this.autoSizeMeasure();
            }
            if( this.characterLayout() === false ){
                this.removeAllChildren();
                return;
            }
            this.lineLayout();
            this.render();
            this.complete();
        }

        autoSizeMeasure( count = 0 ){
            var size = this.size;
            var len = this.text.length;
            var width = this.width;
            var font = txt.FontLoader.fonts[ this.font ];
            var spacing = 0
            if( this.spacing > 0 ){
                spacing = this.spacing / font.units * len;
            }
            if( width < len * size * font.default / font.units + spacing ){
                if( count == 0 ){
                    this.size = Math.ceil( ( ( width - spacing ) / len * font.units / font.default ) * 1.2 );
                    this.spacing = Math.floor( this.spacing * this.size / size );
                    
                }else{
                    this.size--;
                    this.spacing = Math.floor( this.spacing * this.size / size );
                }
                if( this.size < this.minSize ){
                    this.size = this.minSize;
                    return;
                }
                this.autoSizeMeasure( count + 1 );
                if( count == 0 ){
                    this.size--;
                    this.spacing = Math.floor( this.spacing * this.size / size );
                    if( this.size < this.minSize ){
                        this.size = this.minSize;
                    }
                }
            }
        }

        //place characters in words
        characterLayout():boolean {

            //char layout
            var len = this.text.length;
            var char:Character;
            var defaultStyle = {
                size: this.size,
                font: this.font,
                spacing: this.spacing,
                characterCase: this.characterCase,
                fillColor: this.fillColor,
                strokeColor: this.strokeColor,
                strokeWidth: this.strokeWidth
            };
            var currentStyle = defaultStyle;
            var hPosition:number = 0;
            var vPosition:number = 0;
            var charKern:number;
            var spacing:number;
            var lineY:number = 0;
            var firstLine = true;

            var currentLine:Line = new Line();
            
            this.lines.push( currentLine );
            this.block.addChild( currentLine );

            // loop over characters
            // place into lines
            for( var i = 0; i < len; i++ ){
                
                if( this.style !== null && this.style[ i ] !== undefined ){
                    currentStyle = this.style[ i ];
                    // make sure style contains properties needed.
                    if( currentStyle.size === undefined ) currentStyle.size = defaultStyle.size;
                    if( currentStyle.font === undefined ) currentStyle.font = defaultStyle.font;
                    if( currentStyle.spacing === undefined ) currentStyle.spacing = defaultStyle.spacing;
                    if( currentStyle.characterCase === undefined ) currentStyle.characterCase = defaultStyle.characterCase;
                    if( currentStyle.fillColor === undefined ) currentStyle.fillColor = defaultStyle.fillColor;
                    if( currentStyle.strokeColor === undefined ) currentStyle.strokeColor = defaultStyle.strokeColor;
                    if( currentStyle.strokeWidth === undefined ) currentStyle.strokeWidth = defaultStyle.strokeWidth;
                }

                // newline
                // mark word as having newline
                // create new word
                // new line has no character
                if( this.text.charAt( i ) == "\n" || this.text.charAt( i ) == "\r" ){

                    //only if not last char
                    if( i < len - 1 ){
                        if( firstLine === true ){
                            vPosition = currentStyle.size;
                            currentLine.measuredHeight = currentStyle.size;
                            currentLine.measuredWidth = hPosition;
                            lineY = 0;
                            currentLine.y = 0;
                        }else if( this.lineHeight != undefined ){
                            vPosition = this.lineHeight;
                            currentLine.measuredHeight = vPosition;
                            currentLine.measuredWidth = hPosition;
                            lineY = lineY + vPosition;
                            currentLine.y = lineY;
                        }else{
                            vPosition = char.measuredHeight;
                            currentLine.measuredHeight = vPosition;
                            currentLine.measuredWidth = hPosition;
                            lineY = lineY + vPosition;
                            currentLine.y = lineY;
                        }

                        firstLine = false;
                        currentLine = new Line();
                        currentLine.measuredHeight = currentStyle.size;
                        currentLine.measuredWidth = 0;
                        this.lines.push( currentLine );
                        this.block.addChild( currentLine );
                        vPosition = 0;
                        hPosition = 0;
                    }

                    if( this.text.charAt( i ) == "\r" && this.text.charAt( i + 1 ) == "\n" ){
                        i++;
                    }
                    
                    continue;
                }

                //runtime test for font
                if( txt.FontLoader.isLoaded( currentStyle.font ) === false ){
                    txt.FontLoader.load( this , [ currentStyle.font ] );
                    return false;
                }

                // create character
                char = new Character( this.text.charAt( i ) , currentStyle , i );

                if( firstLine === true ){
                    
                    if( vPosition < char.size ){
                        vPosition = char.size;
                    }

                }else if( this.lineHeight != undefined && this.lineHeight > 0 ){
                    if( vPosition < this.lineHeight ){
                        vPosition = this.lineHeight;
                    }
                }else if( char.measuredHeight > vPosition ){
                    vPosition = char.measuredHeight;
                }

                //swap character if ligature
                //ligatures removed if spacing or this.ligatures is false
                if( currentStyle.spacing == 0 && this.ligatures == true ){
                    //1 char match
                    var ligTarget = this.text.substr( i , 4 );
                    if( char._font.ligatures[ ligTarget.charAt( 0 ) ] ){
                        //2 char match
                        if( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ] ){
                            //3 char match
                            if( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ][ ligTarget.charAt( 2 ) ] ){
                                //4 char match
                                if( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ][ ligTarget.charAt( 2 ) ][ ligTarget.charAt( 3 ) ] ){
                                    //swap 4 char ligature
                                    char.setGlyph( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ][ ligTarget.charAt( 2 ) ][ ligTarget.charAt( 3 ) ].glyph );
                                    i = i+3;
                                }else{
                                    //swap 3 char ligature
                                    char.setGlyph( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ][ ligTarget.charAt( 2 ) ].glyph );
                                    i = i+2;
                                }
                            }else{
                                //swap 2 char ligature
                                char.setGlyph( char._font.ligatures[ ligTarget.charAt( 0 ) ][ ligTarget.charAt( 1 ) ].glyph );
                                i = i + 1;
                            }
                        }
                    }
                }

                if( hPosition + char.measuredWidth > this.width ){
                    
                    var lastchar:Character = <txt.Character>currentLine.children[ currentLine.children.length - 1 ];
                    if( lastchar.characterCode == 32 ){
                        currentLine.measuredWidth = hPosition - lastchar.measuredWidth - lastchar.spacingOffset() - lastchar._glyph.getKerning( this.getCharCodeAt( i ) , lastchar.size );
                    }else{
                        currentLine.measuredWidth = hPosition - lastchar.spacingOffset() - lastchar._glyph.getKerning( this.getCharCodeAt( i ) , lastchar.size );
                    }
                    if( firstLine === true ){
                        currentLine.measuredHeight = vPosition;
                        currentLine.y = 0;
                        lineY = 0;
                    }else{
                        currentLine.measuredHeight = vPosition;
                        lineY = lineY + vPosition;
                        currentLine.y = lineY;
                    }
                    firstLine = false;
                    currentLine = new Line();
                    currentLine.addChild( char );

                    if( char.characterCode == 32 ){
                        hPosition = 0;
                    }else{
                        hPosition = char.x + ( char._glyph.offset * char.size ) + char.characterCaseOffset + char.spacingOffset();
                    }
                    
                    this.lines.push( currentLine );
                    this.block.addChild( currentLine );
                    vPosition = 0;
                
                }else{
                    char.x = hPosition;
                    // push character into word
                    currentLine.addChild( char );
                    hPosition = char.x + ( char._glyph.offset * char.size ) + char.characterCaseOffset + char.spacingOffset() + char._glyph.getKerning( this.getCharCodeAt( i + 1 ) , char.size );
                }

            }
            //case of empty word at end.
            if( currentLine.children.length == 0 ){
                var lw = this.lines.pop();
                currentLine = this.lines[ this.lines.length - 1 ];
                hPosition = currentLine.measuredWidth;
                vPosition = currentLine.measuredHeight;
                
            }
            if( firstLine === true ){
                currentLine.measuredWidth = hPosition;
                currentLine.measuredHeight = vPosition;
                currentLine.y = 0;
            }else{
                currentLine.measuredWidth = hPosition;
                currentLine.measuredHeight = vPosition;
                if( vPosition == 0 ){
                    if( this.lineHeight ){
                        vPosition = this.lineHeight;
                    }else{
                        vPosition = currentStyle.size;
                    }
                }
                currentLine.y = lineY + vPosition;
            }
            return true;
        }

        getCharCodeAt( index:number ):number {
            if( this.characterCase == txt.Case.NORMAL ){
                return this.text.charAt( index ).charCodeAt( 0 );

            }else if( this.characterCase == txt.Case.UPPER ){
                return this.text.charAt( index ).toUpperCase().charCodeAt( 0 );

            }else if( this.characterCase == txt.Case.LOWER ){
                return this.text.charAt( index ).toLowerCase().charCodeAt( 0 );

            }else if( this.characterCase == txt.Case.SMALL_CAPS ){
                return this.text.charAt( index ).toUpperCase().charCodeAt( 0 );

            }else{
                return this.text.charAt( index ).charCodeAt( 0 );
            }
        }

        
        lineLayout(){
            // loop over lines
            // place into text
            var blockHeight = 0;
            var measuredWidth = 0;
            var measuredHeight = 0;
            var line;
            var a = txt.Align;
            
            var fnt:txt.Font = txt.FontLoader.getFont( this.font );
            var aHeight = this.size * fnt.ascent / fnt.units;
            var cHeight = this.size * fnt[ 'cap-height' ] / fnt.units;
            var xHeight = this.size * fnt[ 'x-height' ] / fnt.units;
            var dHeight = this.size * fnt.descent / fnt.units;
            var lastCharOffset = 0;
                
            var len = this.lines.length;
            for( var i = 0; i < len; i++ ){
                line = this.lines[ i ];
                measuredHeight += line.measuredHeight;
                
                if( line.lastCharacter() ){
                    lastCharOffset = line.lastCharacter().spacingOffset();
                }else{
                    lastCharOffset = 0;
                }

                if( this.align === a.TOP_CENTER ){
                    //move to center
                    line.x = ( this.width - line.measuredWidth + lastCharOffset ) / 2;
                }else if( this.align === a.TOP_RIGHT ){
                    //move to right
                    line.x = ( this.width - line.measuredWidth );
                }else if( this.align === a.MIDDLE_CENTER ){
                    //move to center
                    line.x = ( this.width - line.measuredWidth + lastCharOffset ) / 2;
                }else if( this.align === a.MIDDLE_RIGHT ){
                    //move to right
                    line.x = ( this.width - line.measuredWidth );
                }else if( this.align === a.BOTTOM_CENTER ){
                    //move to center
                    line.x = ( this.width - line.measuredWidth + lastCharOffset ) / 2;
                }else if( this.align === a.BOTTOM_RIGHT ){
                    //move to right
                    line.x = ( this.width - line.measuredWidth );
                }
            }

            //TOP ALIGNED
            if( this.align === a.TOP_LEFT || this.align === a.TOP_CENTER || this.align === a.TOP_RIGHT  ){
                if( fnt.top == 0 ){
                    this.block.y = this.lines[ 0 ].measuredHeight * fnt.ascent / fnt.units;
                }else{
                    this.block.y = this.lines[ 0 ].measuredHeight * fnt.ascent / fnt.units + this.lines[ 0 ].measuredHeight * fnt.top / fnt.units;
                }

            //MIDDLE ALIGNED
            }else if( this.align === a.MIDDLE_LEFT || this.align === a.MIDDLE_CENTER || this.align === a.MIDDLE_RIGHT  ){
                this.block.y = this.lines[ 0 ].measuredHeight + ( this.height - measuredHeight ) / 2 + this.lines[ 0 ].measuredHeight * fnt.middle / fnt.units ;
            
            //BOTTOM ALIGNED
            }else if( this.align === a.BOTTOM_LEFT || this.align === a.BOTTOM_CENTER || this.align === a.BOTTOM_RIGHT  ){
               this.block.y = this.height - this.lines[ this.lines.length - 1 ].y + this.lines[ 0 ].measuredHeight* fnt.bottom / fnt.units;
            }
        }

    }

}