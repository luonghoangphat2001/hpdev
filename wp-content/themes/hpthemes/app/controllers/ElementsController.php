<?php 
class ElementsController {

    public static $argsRenderElements;

    public function Html( $return = 'echo' ) 
    {
        // check support mode
        if ( isset ( $_GET['hp-element'] ) && $_GET['hp-element'] == 'args' ) {
            echo '<pre>';
            print_r( self::$argsRenderElements );
            echo '</pre>';
            return;
        } else {
            $contents = '';
            $argsListElementHtml = self::$argsRenderElements;
            if ( ! empty ( $argsListElementHtml ) && !$this->isError() ) {
                ob_start();
                foreach ( $argsListElementHtml as $key => $htmlFileItem ) {
                    // get info file item
                    $htmlFilePath   = $htmlFileItem['filePath'];
                    $htmlFileFolder = $htmlFileItem['folder'];
                    $htmlFileName   = $htmlFileItem['fileName'];
                    // add id
                    $htmlFileData = [
                        'id' => $htmlFileItem['fileName'],
                    ];
                    // check add class
                    if ( isset ( $htmlFileItem['classes'] ) && ! empty ( $htmlFileItem['classes'] ) ) {
                        $htmlFileData['classes'] = $htmlFileItem['classes'];
                    } else {
                        $htmlFileData['classes'] = 'hp-section class-empty';
                    }
                    // check add class
                    if ( isset ( $htmlFileItem['attrs'] ) && ! empty ( $htmlFileItem['attrs'] ) ) {
                        $htmlAttrItem = '';
                        foreach ( $htmlFileItem['attrs'] as $kAttr => $valueAttr ) {
                            $htmlAttrItem .= sprintf ( '%1$s="%2$s"', esc_attr( $kAttr ), esc_attr( $valueAttr ) );
                        }
                        // results
                        $htmlFileData['attrs'] = $htmlAttrItem;
                    } else {
                        $htmlFileData['attrs'] = '';
                    }
                    // check add custom data
                    if ( isset ( $htmlFileItem['data'] ) && ! empty ( $htmlFileItem['data'] ) ) {
                        if ( !is_array ( $htmlFileItem['data'] ) ) {
                            $htmlFileData['simple'] = esc_attr( $htmlFileItem['data'] );
                        } else {
                            $htmlFileData = array_merge( $htmlFileItem['data'], $htmlFileData );
                        }
                    }
                    if ( file_exists( $htmlFilePath ) ) {
                        // check file before section
                        if ( !strpos( $contents, '<section' ) ) {
                            self::before( $htmlFileData );
                        }
                        get_template_part( $htmlFileFolder . '/' . $htmlFileName, '', $htmlFileData );
                        // check file after section
                        if ( !strpos( $contents, '</section>' ) ) {
                            self::after( $htmlFileData );
                        }
                    }
                }
                $contents = ob_get_clean();
            }
            // check return
            if ( $return == 'return' ) {
                return $contents;
            } else {
                echo $contents;
            }
        }
    }

    public function Args() 
    {
        echo '<pre>';
        print_r( self::$argsRenderElements );
        echo '</pre>';
    }

    public static function before( $argsData = [] ) 
    {
        // define
        $style   = isset ( $argsData['style'] ) ? esc_attr( $argsData['style'] ) : 'section';
        $id      = isset ( $argsData['id'] ) ? esc_attr( $argsData['id'] ) : '';
        $classes = isset ( $argsData['classes'] ) ? esc_attr( $argsData['classes'] ) : '';
        $attrs   = isset ( $argsData['attrs'] ) ? $argsData['attrs'] : '';
        echo sprintf ( '<%1$s id="%2$s" class="%3$s" %4$s>', $style, $id, $classes, $attrs );
    }

    public static function after( $argsData = [] ) 
    {
        // define
        $style = isset ( $argsData['style'] ) ? esc_attr( $argsData['style'] ) : 'section';
        echo sprintf ( '</%1$s>', $style );
    }

    public static function Group( $groupName = '', $argsData = [] ) 
    {
        $groupElements        = [];
        $listElementRegsiters = self::regsiterElements();
        // reset args
        self::resetArgs();
        // check empty section name
        if ( empty ( $groupName ) ) {
            // thông báo lỗi
            self::$argsRenderElements = Notice::Error( '404', __( '[groupName] không được để trống!', 'HPmedia' ) );
            return new self;
        }
        // check empty list element
        if ( ! empty ( $listElementRegsiters ) ) {
            foreach ( $listElementRegsiters as $key => $itemElement ) {
                if ( $key == $groupName ) {
                    $groupElements = $itemElement;
                }
            }
        }
        // kiểm tra rỗng
        if ( empty ( $groupElements ) ) {
            // thông báo lỗi
            self::$argsRenderElements = Notice::Error( '404', __( 'Trường ['.$groupName.'] không đúng hoặc tồn tại!', 'HPmedia' ) );
            return new self;
        }
        // // sắp sếp thứ tự [order] tăng dần
        self::reOrderArray( $groupElements, 'order' );
        // add data custom
        if ( ! empty ( $groupElements ) ) {
            $totalSection = count( $groupElements );
            foreach ( $groupElements as $key => $changeItem ) {
                // add new array
                self::$argsRenderElements[$key] = $changeItem;
                // add new class
                $newClasses = '';
                if ( isset ( $argsData[$key]['classes'] ) && ! empty ( $argsData[$key]['classes'] ) ) {
                    $newClasses = ' '. esc_attr( $argsData[$key]['classes'] );
                }
                // check and add custom attribute
                if ( isset ( $argsData[$key]['attrs'] ) && ! empty ( $argsData[$key]['attrs'] ) ) {
                    $groupElements[$key]['attrs'] = $argsData[$key]['attrs'];
                } else {
                    $groupElements[$key]['attrs'] = '';
                }
                // check and add custom data
                if ( isset ( $argsData[$key]['data'] ) && ! empty ( $argsData[$key]['data'] ) ) {
                    $groupElements[$key]['data'] = $argsData[$key]['data'];
                } else {
                    $groupElements[$key]['data'] = '';
                }
                // get stt section
                $loopSttSection = $groupElements[$key]['order'];
                // check and add custom insert section
                // và khác [hidden] section
                $totalBefore = $totalAfter = 0;
                if ( isset ( $argsData[$key]['insert'] ) && ! empty ( $argsData[$key]['insert'] ) AND !isset( $argsData[$key]['hidden'] ) ) {
                    // check insert befor
                    if ( isset ( $argsData[$key]['insert']['before'] ) && ! empty ( $argsData[$key]['insert']['before'] ) ) {
                        $argsInsertBefore = $argsData[$key]['insert']['before'];
                        // add insert data befor
                        $totalBefore = count ( $argsInsertBefore );
                        if ( ! empty ( $argsInsertBefore ) ) {
                            foreach ( $argsInsertBefore as $isBr => $isBeforeValue ) {
                                // add new array 
                                // nếu giá trị truyền vào là dạng array thì sẽ có nghĩa là key section có truyền tham số data
                                if ( is_array ( $isBeforeValue ) ) {
                                    $getArgsBeforeSection = self::argsSection( $isBr, $isBeforeValue );
                                    if ( ! empty ( $getArgsBeforeSection ) ) {
                                        // change custom class before
                                        if ( isset ( $getArgsBeforeSection['classes'] ) && ! empty ( $getArgsBeforeSection['classes'] ) ) {
                                            $getArgsBeforeSection['classes'] = $getArgsBeforeSection['classes'] .' '. 'item-group-section insert-before-section';
                                        }
                                        $groupElements = self::insertArrayPosition( $groupElements, [$getArgsBeforeSection['fileName'] => $getArgsBeforeSection], $key );
                                    }
                                } else {
                                    // ngược lại thì chỉ lấy array section và không có data 
                                    $getArgsBeforeSection = self::argsSection( $isBeforeValue );
                                    if ( ! empty ( $getArgsBeforeSection ) ) {
                                        // change custom class before
                                        if ( isset ( $getArgsBeforeSection['classes'] ) && ! empty ( $getArgsBeforeSection['classes'] ) ) {
                                            $getArgsBeforeSection['classes'] = $getArgsBeforeSection['classes'] .' '. 'item-group-section insert-before-section';
                                        }
                                        $groupElements = self::insertArrayPosition( $groupElements, [$getArgsBeforeSection['fileName'] => $getArgsBeforeSection], $key );
                                    }
                                }
                            } 
                        }
                    }
                    // check insert after
                    if ( isset ( $argsData[$key]['insert']['after'] ) && ! empty ( $argsData[$key]['insert']['after'] ) ) {
                        $argsInsertAfter = $argsData[$key]['insert']['after'];
                        // add insert data after
                        $totalAfter = count ( $argsInsertAfter );
                        if ( ! empty ( $argsInsertAfter ) ) {
                            // check vị trí
                            $positionAfter = ( $totalBefore + intval( $loopSttSection ) ) + 1;
                            if ( $positionAfter >= $totalSection  ) { 
                                foreach ( $argsInsertAfter as $isAr => $isAfterValue ) { 
                                    // add new array
                                    // nếu giá trị truyền vào là dạng array thì sẽ có nghĩa là key section có truyền tham số data
                                    if ( is_array ( $isAfterValue ) ) {
                                        $getArgsAfterSectionEnd = self::argsSection( $isAr, $isAfterValue );
                                        if ( ! empty ( $getArgsAfterSectionEnd ) ) {
                                            $groupElements[$getArgsAfterSectionEnd['fileName']] = $getArgsAfterSectionEnd;
                                        }
                                    } else {
                                        $getArgsAfterSectionEnd = self::argsSection( $isAfterValue );
                                        if ( ! empty ( $getArgsAfterSectionEnd ) ) {
                                            $groupElements[$getArgsAfterSectionEnd['fileName']] = $getArgsAfterSectionEnd;
                                        }
                                    }
                                    // change custom class after
                                    if ( isset ( $groupElements[$getArgsAfterSectionEnd['fileName']]['classes'] ) && ! empty ( $groupElements[$getArgsAfterSectionEnd['fileName']]['classes'] ) ) {
                                        $groupElements[$getArgsAfterSectionEnd['fileName']]['classes'] = $groupElements[$getArgsAfterSectionEnd['fileName']]['classes'] . ' ' . 'insert-after-section item-group-section';
                                    }
                                }
                            } else {
                                $nextKeySection = self::nextKeyArray( $groupElements, $key );
                                foreach ( $argsInsertAfter as $isAr => $isAfterValue ) {
                                    // add new array
                                    // nếu giá trị truyền vào là dạng array thì sẽ có nghĩa là key section có truyền tham số data
                                    if ( is_array ( $isAfterValue ) ) {
                                        $getArgsAfterSection = self::argsSection( $isAr, $isAfterValue );
                                        if ( ! empty ( $getArgsAfterSection ) ) {
                                            // change custom class after
                                            if ( isset ( $getArgsAfterSection['classes'] ) && ! empty ( $getArgsAfterSection['classes'] ) ) {
                                                $getArgsAfterSection['classes'] = $getArgsAfterSection['classes'] .' '. 'item-group-section insert-after-section';
                                            }
                                            $groupElements = self::insertArrayPosition( $groupElements, [$getArgsAfterSection['fileName'] => $getArgsAfterSection], $nextKeySection );
                                        }
                                    } else {
                                        // ngược lại thì chỉ lấy array section và không có data 
                                        $getArgsAfterSection = self::argsSection( $isAfterValue );
                                        if ( ! empty ( $getArgsAfterSection ) ) {
                                            // change custom class after
                                            if ( isset ( $getArgsAfterSection['classes'] ) && ! empty ( $getArgsAfterSection['classes'] ) ) {
                                                $getArgsAfterSection['classes'] = $getArgsAfterSection['classes'] .' '. 'item-group-section insert-after-section';
                                            }
                                            $groupElements = self::insertArrayPosition( $groupElements, [$getArgsAfterSection['fileName'] => $getArgsAfterSection], $nextKeySection );
                                        }
                                    }
                                } 
                            }
                        }
                    }
                    // remove array insert
                    unset( self::$argsRenderElements[$key]['insert'] );
                }
                // change custom class
                if ( isset ( $groupElements[$key]['classes'] ) && ! empty ( $groupElements[$key]['classes'] ) ) {
                    $groupElements[$key]['classes'] = $groupElements[$key]['classes'] . $newClasses .' '. 'item-group-section current-section';
                }
                // check hidden section
                if ( isset ( $argsData[$key]['hidden'] ) ) {
                    unset( $groupElements[$key] );
                }
                // add new array
                self::$argsRenderElements = $groupElements;
            }
        } else {
            // results
            self::$argsRenderElements = $groupElements;
        }
        return new self;
    }

    public static function Section( $sectionName = '', $argsData = [] ) 
    {
        $changeFormatName     = explode( '/', $sectionName );
        $listElementRegsiters = self::regsiterElements();
        // reset args
        self::resetArgs();
        // check empty section name
        if ( empty ( $sectionName ) ) {
            // thông báo lỗi
            self::$argsRenderElements = Notice::Error( '404', __( '[sectionName] không được để trống!', 'HPmedia' ) );
            return new self;
        }
        // check array change name
        if ( ! empty ( $changeFormatName ) && count ( $changeFormatName ) > 0 ) {
            // get info file
            $htmlFileFolder = isset ( $changeFormatName[0] ) ? $changeFormatName[0] : '';
            $htmlFileName   = isset ( $changeFormatName[1] ) ? $changeFormatName[1] : '';
            if ( ! empty ( $htmlFileFolder ) && ! empty ( $htmlFileName ) ) {
                if ( isset ( $listElementRegsiters[$htmlFileFolder][$htmlFileName] ) ) {
                    // add new class
                    $newClasses = '';
                    if ( isset ( $argsData['classes'] ) && ! empty ( $argsData['classes'] ) ) {
                        $newClasses = ' '. esc_attr( $argsData['classes'] );
                    }
                    // change custom class
                    if ( isset ( $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] ) && ! empty ( $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] = $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] .' '. 'item-single-section' . $newClasses;
                    }
                    // check and add custom attribute
                    if ( isset ( $argsData['attrs'] ) && ! empty ( $argsData['attrs'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['attrs'] = $argsData['attrs'];
                    } else {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['attrs'] = '';
                    }
                    // add data custom
                    if ( isset ( $argsData['data'] ) && ! empty ( $argsData['data'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['data'] = $argsData['data'];
                    } else {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['data'] = '';
                    }
                    self::$argsRenderElements[$htmlFileName] = $listElementRegsiters[$htmlFileFolder][$htmlFileName];
                } else {
                    // thông báo lỗi
                    self::$argsRenderElements = Notice::Error( '404', __( 'Trường ['.$sectionName.'] không đúng hoặc tồn tại!', 'HPmedia' ) );
                }
            } else {
                // thông báo lỗi
                self::$argsRenderElements = Notice::Error( '404', __( 'Kiểu dữ liệu không đúng hãy thử [folder/section-name]', 'HPmedia' ) );
            }
        }
        return new self;
    } 

    private static function argsSection( $sectionName = '', $argsData = [] )
    {
        $argsSectionData      = [];
        $changeFormatName     = explode( '/', $sectionName );
        $listElementRegsiters = self::regsiterElements();
        // check empty section name
        if ( empty ( $sectionName ) ) {
           return false;
        }
        // check array change name
        if ( ! empty ( $changeFormatName ) && count ( $changeFormatName ) > 0 ) {
            // get info file
            $htmlFileFolder = isset ( $changeFormatName[0] ) ? $changeFormatName[0] : '';
            $htmlFileName   = isset ( $changeFormatName[1] ) ? $changeFormatName[1] : '';
            if ( ! empty ( $htmlFileFolder ) && ! empty ( $htmlFileName ) ) {
                if ( isset ( $listElementRegsiters[$htmlFileFolder][$htmlFileName] ) ) {
                    // add new class
                    if ( isset ( $argsData['classes'] ) && ! empty ( $argsData['classes'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] = $listElementRegsiters[$htmlFileFolder][$htmlFileName]['classes'] .' '. esc_attr( $argsData['classes'] );
                    }
                    // add data attrbute
                    if ( isset ( $argsData['attrs'] ) && ! empty ( $argsData['attrs'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['attrs'] = $argsData['attrs'];
                    } else {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['attrs'] = '';
                    }
                    // add data custom
                    if ( isset ( $argsData['data'] ) && ! empty ( $argsData['data'] ) ) {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['data'] = $argsData['data'];
                    } else {
                        $listElementRegsiters[$htmlFileFolder][$htmlFileName]['data'] = '';
                    }
                    $argsSectionData = $listElementRegsiters[$htmlFileFolder][$htmlFileName];
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        return $argsSectionData;
    }

    private static function regsiterElements() 
    {
        $output = [];
        $regsiter_load_files = glob( get_template_directory() . '/partials/*', GLOB_ONLYDIR );
        if ( ! empty ( $regsiter_load_files ) ) {
            foreach ( $regsiter_load_files as $folderPath ) {
                $listFiles = glob( $folderPath . '/*.php' );
                if ( ! empty ( $listFiles ) ) {
                    foreach ( $listFiles as $key => $fieldArgs ) {
                        $moduleComments = [];
                        $moduleInfo     = token_get_all( file_get_contents( $fieldArgs ) );
                        if ( ! empty ( $moduleInfo ) ) {
                            foreach( $moduleInfo as $token ) {
                                if ( $token[0] == T_COMMENT || $token[0] == T_DOC_COMMENT ) {
                                    $moduleComments[] = $token[1];
                                }
                            }
                            if ( ! empty ( $moduleComments ) ) {
                                $_to_string = trim( current( $moduleComments ), "\**/" );
                                if ( ! empty ( $_to_string ) ) {
                                    $folderItem  = self::getFileName( $folderPath );
                                    $sectionItem = self::getFileName( $fieldArgs );
                                    // default
                                    $output[$folderItem][$sectionItem]['name']        = '';
                                    $output[$folderItem][$sectionItem]['description'] = '';
                                    $output[$folderItem][$sectionItem]['author']      = '';
                                    $output[$folderItem][$sectionItem]['folder']      = '';
                                    $output[$folderItem][$sectionItem]['filePath']    = '';
                                    $output[$folderItem][$sectionItem]['fileName']    = '';
                                    $output[$folderItem][$sectionItem]['classes']     = 'hp-section render-' . $sectionItem;
                                    $output[$folderItem][$sectionItem]['order']       = 0;
                                    // loop and add attr comments
                                    foreach ( explode( PHP_EOL, $_to_string ) as $item )  {
                                        $itemData = explode(":",$item);
                                        if ( count($itemData) == 2 ) {
                                            $moduleKey = trim($itemData[0]);
                                            // check
                                            switch ( $moduleKey ) {
                                                case '* Section name':
                                                    $output[$folderItem][$sectionItem]['name'] = trim($itemData[1]);
                                                    break;
                                                case '* Description':
                                                    $output[$folderItem][$sectionItem]['description'] = trim($itemData[1]);
                                                    break;
                                                case '* Author':
                                                    $output[$folderItem][$sectionItem]['author'] = trim($itemData[1]);
                                                    break;
                                                case '* Order':
                                                    $output[$folderItem][$sectionItem]['order'] = trim($itemData[1]);
                                                    break;
                                            }
                                        }
                                    }
                                    //add attr file info
                                    $output[$folderItem][$sectionItem]['folder']   = FILES_PATH . '/' . $folderItem;
                                    $output[$folderItem][$sectionItem]['filePath'] = $fieldArgs;
                                    $output[$folderItem][$sectionItem]['fileName'] = $sectionItem;
                                    // check empty Section name
                                    if ( empty ( $output[$folderItem][$sectionItem]['name'] ) ) {
                                        unset( $output[$folderItem][$sectionItem] );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return $output;
    }

    public static function getBaseName( $filePath = '' ) 
    {
        if ( ! empty ( $filePath ) && file_exists ( $filePath ) ) {
            $fileInfos = pathinfo( $filePath );
            if ( ! empty ( $fileInfos ) ) {
                return $fileInfos['basename'];
            }
        }
    }

    public static function getFileName( $filePath = '' ) 
    {
        if ( ! empty ( $filePath ) && file_exists ( $filePath ) ) {
            $fileInfos = pathinfo( $filePath );
            if ( ! empty ( $fileInfos ) ) {
                return $fileInfos['filename'];
            }
        }
    }

    private static function reOrderArray( &$currentArray, $reOrderBy )
    {
        $sortarray = [];
        if ( ! empty ( $currentArray ) ) {
            foreach ( $currentArray as $key => $row ) {
                $sortarray[$key] = $row[$reOrderBy];
            }
            array_multisort( $sortarray, SORT_ASC, $currentArray );
        }
    }

    private static function insertArrayPosition( $currentArray, $insertedArray, $position ) {
        $i         = 0;
        $new_array = [];
        if ( ! empty ( $currentArray ) ) {
            foreach ( $currentArray as $key => $value ) {
                if ( $key == $position ) {
                    foreach ( $insertedArray as $ikey => $ivalue ) {
                        $new_array[$ikey] = $ivalue;
                    }
                }
                $new_array[$key] = $value;
                $i++;
            }
        }
        return $new_array;
    }

    private static function nextKeyArray( $array, $key ) {
        $keys     = array_keys( $array );
        $position = array_search( $key, $keys );
        if ( isset( $keys[$position + 1] ) ) {
            $nextKey = $keys[$position + 1];
        }
        if ( ! empty ( $nextKey ) ) {
            return $nextKey;
        } else {
            return false;
        }
    }

    private static function resetArgs() 
    {
        self::$argsRenderElements = [];
    }

    public function isError()
    {
        $argsListElementHtml = self::$argsRenderElements;
        // check empty
        if ( empty ( $argsListElementHtml ) ) {
            return true;
        }
        // check array notice isset success == false
        if ( isset ( $argsListElementHtml['success'] ) && $argsListElementHtml['success'] == false ) {
            return true;
        }
        // result ok
        return false;
    }
 
}