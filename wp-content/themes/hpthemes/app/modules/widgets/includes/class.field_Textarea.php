<?php
/**
 * Class HP Custom Widget
 */
class Render_Field_Textarea {

    /**
     * Undocumented function
     *
     * @param array $field_args
     * @return void
     */
    public function render( $field_args = [] ) 
    {

        $output = '';

        if ( isset( $field_args['title'] ) ) {
            $widget_title = $field_args['title'];
        } else {
            $widget_title = __( 'Văn bản dài', 'HPmedia' );
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
            $class = 'class="hp-custom-widget ref-field-textarea '.esc_attr( $field_args['class'] ).'"';
        } else {
            $class = 'class="hp-custom-widget ref-field-textarea"';
        }

        if ( isset ( $field_args['rows'] ) ) {
            $rows = 'rows="'.$field_args['rows'].'"';
        } else {
            $rows = 'rows="5"';
        }

        if ( isset ( $field_args['cols'] ) ) {
            $cols = 'cols="'.$field_args['cols'].'"';
        } else {
            $cols = 'cols="10"';
        }

        if ( isset ( $field_args['name'] ) ) {
            $name = 'name="'.$field_args['name'].'"';
        } else {
            $name = 'name=""';
        }

        if ( isset( $field_args['value'] ) && ! empty ( $field_args['value'] ) ) {
            if ( isset( $field_args['str_text'] ) &&  $field_args['str_text'] == false ) {
                $value = $field_args['value'];
            } else {
                $value = esc_attr( $field_args['value'] );
            }
        } else {
            $value = '';
        }

        if ( isset( $field_args['placeholder'] ) ) {
            $placeholder = 'placeholder="'.esc_attr( $field_args['placeholder'] ).'"';
        } else {
            $placeholder = '';
        }

        $output .= '<div class="hp-widget-items render-field box-field-textarea">';
        $output .= '<div class="box-field-title">';
        $output .= '<label '.$for.' class="txt-label field-textarea-label">';
        $output .=  $widget_title;
        $output .= '</label>';
        $output .= '</div>';
        $output .= '<div class="box-field-content">';
        $output .= '<textarea '.$rows.' '.$cols.' '.$class.' '.$id.' '.$name.' '.$placeholder.'>'.$value.'</textarea>';
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
            if ( isset( $instance[ 'textarea' ] ) ) {
                $textarea = $instance[ 'textarea' ];
            } else {
                $textarea = '';
            }

            // Gọi hàm
            hp_render_field_settings(
                [
                    'type'        => 'textarea',
                    'name'        => $this->get_field_name( 'textarea' ),
                    'id'          => $this->get_field_id( 'textarea' ),
                    'value'       => $textarea,
                    'title'       => __( 'Textarea', 'HPmedia' ),
                    'placeholder' => __( 'Nhập nội dung văn bản', 'HPmedia' ),
                    'docs'        => false,
                ]
            );

            // Cập nhật
            $instance['textarea'] = hp_update_field_settings( $new_instance['textarea'] );
            </code>
        </pre>
        <?php
    }

}
