<?php
/**
 * Class HP Custom Widget
 */
class Render_Field_TrueFalse {

    /**
     * Undocumented function
     *
     * @param array $field_args
     * @return void
     */
    public function render( $field_args = [] ) 
    {

        $output = '';

        if ( isset ( $field_args['title'] ) ) {
            $widget_title = $field_args['title'];
        } else {
            $widget_title = __( 'True / False', 'HPmedia' );
        }

        if ( isset ( $field_args['id'] ) ) {
            $for = 'for="'.$field_args['id'].'"';
        } else {
            $for = 'for="'.$field_args['name'].'"';
        }

        if ( isset ( $field_args['id'] ) ) {
            $id = 'id="'.$field_args['id'].'"';
        } else {
            $id = 'id="'.$field_args['name'].'"';
        }

        if ( isset ( $field_args['class'] ) ) {
            $class = 'class="hp-custom-widget ref-field-truefalse hp-checkbox-field '.$field_args['class'].'"';
        } else {
            $class = 'class="hp-custom-widget ref-field-truefalse hp-checkbox-field"';
        }

        if ( isset ( $field_args['name'] ) ) {
            $name = 'name="'.$field_args['name'].'"';
        } else {
            $name = 'name=""';
        }

        if ( isset( $field_args['value'] ) && ! empty ( $field_args['value'] ) ) {
            $checked = esc_attr( $field_args['value'] );
        } else {
            $checked = '';
        }

        if ( isset( $field_args['placeholder'] ) ) {
            $placeholder = 'placeholder="'.esc_attr( $field_args['placeholder'] ).'"';
        } else {
            $placeholder = '';
        }

        if ( isset ( $field_args['column'] ) && $field_args['column'] == 1 ) {
            $style_clss = 'style="width: 100%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 2 ) {
            $style_clss = 'style="width: 50%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 3 ) {
            $style_clss = 'style="width: 33.3333%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 4 ) {
            $style_clss = 'style="width: 25%;"';
        } elseif ( isset ( $field_args['column'] ) && $field_args['column'] == 5 ) {
            $style_clss = 'style="width: 20%;"';
        } else {
            $style_clss = 'style="width: 25%;"';
        }

        $output .= '<div class="hp-widget-items render-field box-field-truefalse">';
        $output .= '<div class="box-field-title">';
        $output .= '<label class="txt-label field-text-label">';
        $output .=  $widget_title;
        $output .= '</label>';
        $output .= '</div>';
        $output .= '<div class="box-field-content">';
        $output .= '<div class="field-truefalse-item" '.$style_clss.'>';
        $output .= '<div class="truefalse-text hp--checkboxWrap">';
        if ( ! empty ( $checked ) && sanitize_title( $checked ) == true ) {
            $output .= '<input type="checkbox" '.$class.' '.$id.' '.$name.' value="1" checked="checked" />';
        } else {
            $output .= '<input type="checkbox" '.$class.' '.$id.' '.$name.' value="1" />';
        }
        $output .= '<label '.$for.' class="hp-checkbox-label"></label>';
        $output .= '</div>';
        $output .= '</div>';
        $output .= '</div>';
        $output .= '</div>';

        echo $output;

    }

    /**
     * Undocumented function
     *
     * @return void
     */
    public function get_docs() 
    {
        ?>
        <pre>
            <code>
            // Kiểm tra
            if ( isset( $instance[ 'truefalse' ] ) ) {
                $truefalse = $instance[ 'truefalse' ];
            } else {
                $truefalse = '';
            }

            // Gọi hàm
            hp_render_field_settings(
                [
                    'type'         => 'truefalse',
                    'name'         => $this->get_field_name( 'truefalse' ),
                    'id'           => $this->get_field_id( 'truefalse' ),
                    'value'        => $truefalse,
                    'title'        => __( 'True / False', 'HPmedia' ),
                    'placeholder'  => __( 'Chọn giá trị', 'HPmedia' ),
                    'column'       => 4, // max 5
                    'docs'         => false,
                ]
            );

            // Cập nhật
            $instance['truefalse'] = hp_update_field_settings( $new_instance['truefalse'] );
            </code>
        </pre>
        <?php
    }

}
