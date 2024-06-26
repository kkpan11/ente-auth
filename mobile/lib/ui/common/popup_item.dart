import 'package:flutter/material.dart';

class EntePopupMenuItem<T> extends PopupMenuItem<T> {
  final String label;
  final IconData? icon;
  final Widget? iconWidget;

  EntePopupMenuItem(
    this.label, {
    required T value,
    this.icon,
    this.iconWidget,
    Key? key,
  })  : assert(
          icon != null || iconWidget != null,
          'Either icon or iconWidget must be provided.',
        ),
        assert(
          !(icon != null && iconWidget != null),
          'Only one of icon or iconWidget can be provided.',
        ),
        super(
          value: value,
          key: key,
          child: Row(
            children: [
              if (iconWidget != null)
                iconWidget
              else if (icon != null)
                Icon(icon),
              const Padding(
                padding: EdgeInsets.all(8),
              ),
              Text(label),
            ],
          ), // Initially empty, will be populated in build
        );
}
